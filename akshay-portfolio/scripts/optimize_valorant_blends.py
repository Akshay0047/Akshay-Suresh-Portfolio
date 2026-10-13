"""Convert the Valorant .blend sources into web-ready Draco GLBs.

Run headlessly:

    blender --background --python scripts/optimize_valorant_blends.py

For every job below this script:
  1. opens the .blend,
  2. downsizes oversized textures (web GPUs do not need 4K trims),
  3. adds a Decimate (COLLAPSE, ratio 0.6) modifier to every mesh object and
     applies it (shared mesh data cannot be applied, so those keep the
     modifier and the exporter bakes it in via export_apply),
  4. exports a Draco-compressed GLB into public/models/.

A JSON-ish report with world-space bounds is printed for each output so the
React scene can be laid out against real dimensions.
"""

import json
import os
import sys

import addon_utils
import bpy
from mathutils import Vector

addon_utils.enable("io_scene_gltf2", default_set=False, persistent=False)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))

DECIMATE_RATIO = 0.6

# (source blend, output glb, max texture edge in px, export skeleton/skins)
JOBS = (
    ("havenA.blend", "map_site.glb", 512, True),
    # Agents (shared UE skeleton: Spine1-4, L_/R_Hip/Knee/Foot, L_/R_Shoulder/Elbow/Hand, R_WeaponPoint ...)
    ("neonSimple.blend", "agent_neon.glb", 1024, True),
    ("jettSimple.blend", "agent_jett.glb", 1024, True),
    ("reynaSimple.blend", "agent_reyna.glb", 1024, True),
    ("phoenixSimple.blend", "agent_phoenix.glb", 1024, True),
    ("sageSimple.blend", "agent_sage.glb", 1024, True),
    ("sovaSimple.blend", "agent_sova.glb", 1024, True),
    ("gekkoSimple.blend", "agent_gekko.glb", 1024, True),
    ("chamberSimple.blend", "agent_chamber.glb", 1024, True),
    ("cypherComplex.blend", "agent_cypher.glb", 1024, True),
    # Weapons / props. Armature bones (Muzzle, Trigger, Left_Hand_Target ...) stay as glTF nodes.
    ("aristocratVandal.blend", "vandal_gun.glb", 1024, False),
    ("Phantom.blend", "phantom_gun.glb", 1024, False),
    ("aerosolOperator.blend", "operator_gun.glb", 1024, False),
    ("jettKnife.blend", "jett_knife.glb", 1024, False),
    ("sageUltFriendly.blend", "sage_ult.glb", 1024, False),
)

# Allow `-- name1.glb name2.glb` on the command line to run only some jobs.
if "--" in sys.argv:
    _only = set(sys.argv[sys.argv.index("--") + 1 :])
    if _only:
        JOBS = tuple(job for job in JOBS if job[1] in _only)


def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def mesh_objects():
    return [obj for obj in bpy.data.objects if obj.type == "MESH" and obj.data is not None]


def downscale_textures(max_edge):
    scaled = 0
    for image in bpy.data.images:
        if image.type != "IMAGE" or image.size[0] == 0 or image.size[1] == 0:
            continue
        width, height = image.size
        longest = max(width, height)
        if longest <= max_edge:
            continue
        factor = max_edge / longest
        try:
            image.scale(max(1, int(width * factor)), max(1, int(height * factor)))
            scaled += 1
        except RuntimeError as exc:
            print(f"TEXTURE_SKIP {image.name} {exc}")
    return scaled


def drop_shape_keys():
    """Facial morph targets are unused on the web and block applying Decimate."""
    dropped = 0
    for obj in mesh_objects():
        if obj.data.shape_keys is not None and obj.data.users == 1:
            bpy.context.view_layer.objects.active = obj
            obj.shape_key_clear()
            dropped += 1
    return dropped


def bake_prop_transforms():
    """Apply loc/rot/scale on parentless, unrigged meshes so their pivot is [0, 0, 0]."""
    ensure_object_mode()
    baked = 0
    for obj in mesh_objects():
        if obj.parent is not None or obj.data.users > 1:
            continue
        if any(mod.type == "ARMATURE" for mod in obj.modifiers):
            continue
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        baked += 1
    return baked


def decimate_all_meshes(ratio):
    ensure_object_mode()
    applied = 0
    deferred = 0
    for obj in mesh_objects():
        modifier = obj.modifiers.new("WebDecimate", "DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = ratio
        if obj.data.users > 1:
            # Shared mesh data cannot be applied; the exporter bakes the modifier in.
            deferred += 1
            continue
        try:
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            applied += 1
        except RuntimeError as exc:
            print(f"DECIMATE_DEFERRED {obj.name} {exc}")
            deferred += 1
    return applied, deferred


def world_bounds():
    low = Vector((float("inf"),) * 3)
    high = Vector((float("-inf"),) * 3)
    for obj in mesh_objects():
        if obj.hide_viewport:
            continue
        for corner in obj.bound_box:
            point = obj.matrix_world @ Vector(corner)
            low = Vector((min(low[i], point[i]) for i in range(3)))
            high = Vector((max(high[i], point[i]) for i in range(3)))
    return low, high


def export_glb(path, export_skins):
    identifiers = {prop.identifier for prop in bpy.ops.export_scene.gltf.get_rna_type().properties}
    kwargs = {"filepath": path, "export_format": "GLB"}
    optional = {
        "export_apply": True,
        "use_visible": True,
        "export_draco_mesh_compression_enable": True,
        "export_draco_mesh_compression_level": 6,
        "export_yup": True,
        "export_animations": True,
        "export_skins": export_skins,
        "export_materials": "EXPORT",
        "export_image_format": "WEBP",
    }
    for key, value in optional.items():
        if key in identifiers:
            kwargs[key] = value
    print("EXPORT_ARGS", sorted(key for key in kwargs if key != "filepath"))
    bpy.ops.export_scene.gltf(**kwargs)


def process(blend_name, out_name, max_texture, export_skins):
    source = os.path.join(ROOT, blend_name)
    destination = os.path.join(ROOT, out_name)
    print(f"OPEN {source}")
    bpy.ops.wm.open_mainfile(filepath=source)

    before = sum(len(obj.data.vertices) for obj in mesh_objects())
    scaled = downscale_textures(max_texture)
    drop_shape_keys()
    if not any(obj.type == "ARMATURE" for obj in bpy.data.objects):
        bake_prop_transforms()
    applied, deferred = decimate_all_meshes(DECIMATE_RATIO)
    bones = [bone.name for obj in bpy.data.objects if obj.type == "ARMATURE" for bone in obj.data.bones]
    low, high = world_bounds()

    export_glb(destination, export_skins)
    size = os.path.getsize(destination) if os.path.isfile(destination) else 0
    if size < 1000:
        raise RuntimeError(f"glTF export did not write a valid file at {destination}")

    report = {
        "file": out_name,
        "source": blend_name,
        "bytes": size,
        "meshes": len(mesh_objects()),
        "vertsBefore": before,
        "decimateApplied": applied,
        "decimateDeferredToExport": deferred,
        "texturesDownscaled": scaled,
        "boundsMin": [round(v, 3) for v in low],
        "boundsMax": [round(v, 3) for v in high],
        "bones": bones[:70],
    }
    print("REPORT", json.dumps(report))


if __name__ == "__main__":
    failures = 0
    for job in JOBS:
        try:
            process(*job)
        except Exception as exc:  # keep going so one bad file doesn't hide the rest
            failures += 1
            print(f"JOB_FAILED {job[0]} {type(exc).__name__}: {exc}")
    print("ALL_EXPORTS_OK" if failures == 0 else f"EXPORTS_FAILED {failures}")
    sys.exit(1 if failures else 0)
