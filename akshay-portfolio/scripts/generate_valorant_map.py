"""Procedural Ascent-style courtyard for the portfolio scene.

Run with Blender in background mode. Writes:
  akshay-portfolio/public/models/valorant_map.glb
"""

import math
import os

import addon_utils
import bpy
from mathutils import Vector

addon_utils.enable("io_scene_gltf2", default_set=False, persistent=False)

OUT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "models", "valorant_map.glb")
)


def set_input(node, name, value):
    socket = node.inputs.get(name)
    if socket is None:
        names = [socket.name for socket in node.inputs]
        raise KeyError(f"Missing input '{name}' on {node.name}. Available: {names}")
    socket.default_value = value


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    return obj


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablock in (
        bpy.data.meshes,
        bpy.data.lights,
        bpy.data.cameras,
        bpy.data.materials,
    ):
        for block in list(datablock):
            if block.users == 0:
                datablock.remove(block)


def principled(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.node_tree.nodes.clear()
    output = material.node_tree.nodes.new("ShaderNodeOutputMaterial")
    output.location = (320, 0)
    bsdf = material.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    material.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material, bsdf


def make_concrete():
    material, bsdf = principled("Concrete")
    set_input(bsdf, "Base Color", (0.16, 0.16, 0.17, 1.0))
    set_input(bsdf, "Roughness", 0.92)
    set_input(bsdf, "Metallic", 0.0)
    set_input(bsdf, "Specular IOR Level", 0.28)
    return material


def make_radianite_body():
    material, bsdf = principled("RadianiteBody")
    set_input(bsdf, "Base Color", (0.015, 0.09, 0.1, 1.0))
    set_input(bsdf, "Roughness", 0.38)
    set_input(bsdf, "Metallic", 0.55)
    set_input(bsdf, "Specular IOR Level", 0.5)
    return material


def make_radianite_trim():
    material, bsdf = principled("RadianiteTrim")
    # Edge/trim glow. The Emission node feeds the Principled emission so the
    # cyan trim survives glTF as an emissive material.
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    emission = nodes.new("ShaderNodeEmission")
    emission.location = (-280, -180)
    emission.inputs["Color"].default_value = (0.0, 1.0, 1.0, 1.0)
    emission.inputs["Strength"].default_value = 6.0
    links.new(emission.outputs["Emission"], bsdf.inputs["Emission Color"])
    set_input(bsdf, "Base Color", (0.0, 0.35, 0.38, 1.0))
    set_input(bsdf, "Emission Strength", 8.0)
    set_input(bsdf, "Roughness", 0.22)
    set_input(bsdf, "Metallic", 0.15)
    return material


def setup_world():
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("ValorantWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputWorld")
    output.location = (420, 0)
    background = nodes.new("ShaderNodeBackground")
    background.location = (80, 80)
    background.inputs["Color"].default_value = (0.012, 0.016, 0.022, 1.0)
    background.inputs["Strength"].default_value = 0.08

    volume = nodes.new("ShaderNodeVolumeScatter")
    volume.location = (80, -160)
    volume.inputs["Color"].default_value = (0.35, 0.5, 0.62, 1.0)
    volume.inputs["Density"].default_value = 0.018
    volume.inputs["Anisotropy"].default_value = 0.15

    links.new(background.outputs["Background"], output.inputs["Surface"])
    links.new(volume.outputs["Volume"], output.inputs["Volume"])


def add_cube(name, location, dimensions, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dimensions
    activate(obj)
    bpy.ops.object.transform_apply(scale=True)
    if material is not None:
        obj.data.materials.append(material)
    return obj


def add_cylinder(name, location, radius, depth, rotation, material=None):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=28,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    activate(obj)
    if material is not None:
        obj.data.materials.append(material)
    return obj


def add_arch_wall(name, center_xy, axis, length, height, thickness, opening_width, jamb_height, material):
    """Build a wall from piers, a header, and spandrel blocks around an open arch.

    A boolean cut was not surviving export as a hole, so the opening is real empty space.
    """
    cx, cy = center_xy
    half = length / 2.0
    half_open = opening_width / 2.0
    radius = half_open
    apex = jamb_height + radius
    side = half - half_open
    header_height = max(0.2, height - apex)
    pieces = []

    def place(suffix, location, dimensions):
        pieces.append(add_cube(f"{name}_{suffix}", location, dimensions, material))

    if axis == "X":
        place("L", (cx - (half_open + side / 2.0), cy, height / 2.0), (side, thickness, height))
        place("R", (cx + (half_open + side / 2.0), cy, height / 2.0), (side, thickness, height))
        place("H", (cx, cy, apex + header_height / 2.0), (opening_width, thickness, header_height))

        def cell_location(along, up):
            return (cx + along, cy, up)
    else:
        place("L", (cx, cy - (half_open + side / 2.0), height / 2.0), (thickness, side, height))
        place("R", (cx, cy + (half_open + side / 2.0), height / 2.0), (thickness, side, height))
        place("H", (cx, cy, apex + header_height / 2.0), (thickness, opening_width, header_height))

        def cell_location(along, up):
            return (cx, cy + along, up)

    step = 0.32
    index = 0
    along = -half_open + step / 2.0
    while along < half_open:
        up = jamb_height + step / 2.0
        while up < apex:
            dx = along
            dz = up - jamb_height
            if dx * dx + dz * dz > radius * radius:
                place(f"S{index:02d}", cell_location(along, up), (
                    step * 0.96 if axis == "X" else thickness,
                    thickness if axis == "X" else step * 0.96,
                    step * 0.96,
                ))
                index += 1
            up += step
        along += step
    return pieces


def add_empty(name, location):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.45
    empty.location = Vector(location)
    bpy.context.scene.collection.objects.link(empty)
    return empty


def add_point_light(name, location, color, energy):
    light_data = bpy.data.lights.new(name, "POINT")
    light_data.color = color
    light_data.energy = energy
    light_data.shadow_soft_size = 0.45
    light = bpy.data.objects.new(name, light_data)
    light.location = Vector(location)
    bpy.context.scene.collection.objects.link(light)
    return light


def add_radianite_crate(index, location, size, body_material, trim_material):
    center = (location[0], location[1], location[2] + size / 2.0)
    crate = add_cube(f"RadianiteCrate_{index:02d}", center, (size, size, size), body_material)
    bevel = crate.modifiers.new("Bevel", "BEVEL")
    bevel.width = size * 0.055
    bevel.segments = 2
    bevel.affect = "EDGES"
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(50)
    activate(crate)
    bpy.ops.object.modifier_apply(modifier=bevel.name)

    activate(crate)
    bpy.ops.object.duplicate()
    trim = bpy.context.active_object
    trim.name = f"RadianiteTrim_{index:02d}"
    wire = trim.modifiers.new("Wire", "WIREFRAME")
    wire.thickness = max(0.028, size * 0.03)
    wire.use_replace = True
    wire.use_boundary = True
    wire.use_even_offset = True
    activate(trim)
    bpy.ops.object.modifier_apply(modifier=wire.name)
    trim.data.materials.clear()
    trim.data.materials.append(trim_material)
    return crate, trim


def build():
    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    concrete = make_concrete()
    body = make_radianite_body()
    trim = make_radianite_trim()
    setup_world()

    wall_h = 6.4
    wall_t = 0.48
    yard = 9.0
    opening = 3.5
    jamb = 3.35

    add_cube("Floor_Base", (0.0, 1.0, -0.16), (42.0, 44.0, 0.32), concrete)
    add_cube("Floor_Courtyard", (0.0, 0.0, 0.025), (17.2, 17.2, 0.05), concrete)
    add_cube("Floor_NorthHall", (0.0, 14.6, 0.03), (4.8, 10.6, 0.06), concrete)
    add_cube("Floor_EastBay", (13.3, 0.0, 0.03), (8.0, 7.2, 0.06), concrete)
    add_cube("Floor_SouthTerrace", (0.0, -12.8, 0.03), (7.2, 7.0, 0.06), concrete)
    add_cube("Floor_WestApproach", (-13.2, 0.0, 0.42), (7.6, 8.0, 0.16), concrete)

    # Steps up to the west overlook and down from the south arch.
    add_cube("Step_West_01", (-9.7, 0.0, 0.1), (1.1, 4.4, 0.2), concrete)
    add_cube("Step_West_02", (-10.7, 0.0, 0.22), (1.0, 4.6, 0.44), concrete)
    add_cube("Step_South_01", (0.0, -9.7, 0.08), (4.2, 0.7, 0.16), concrete)
    add_cube("Step_South_02", (0.0, -10.45, 0.04), (4.6, 0.7, 0.08), concrete)

    add_arch_wall("Wall_North", (0.0, yard), "X", 18.0, wall_h, wall_t, opening, jamb, concrete)
    add_arch_wall("Wall_South", (0.0, -yard), "X", 18.0, wall_h, wall_t, opening, jamb, concrete)
    add_arch_wall("Wall_East", (yard, 0.0), "Y", 18.0, wall_h, wall_t, opening, jamb, concrete)
    add_arch_wall("Wall_West", (-yard, 0.0), "Y", 18.0, wall_h, wall_t, opening, jamb, concrete)

    add_cube("Wall_NorthHall_West", (-2.4, 14.6, 2.5), (0.35, 10.6, 5.0), concrete)
    add_cube("Wall_NorthHall_East", (2.4, 14.6, 2.5), (0.35, 10.6, 5.0), concrete)
    add_cube("Wall_NorthHall_End", (0.0, 19.9, 2.5), (4.8, 0.35, 5.0), concrete)

    add_cube("Wall_EastBay_North", (13.3, 3.6, 2.4), (8.0, 0.35, 4.8), concrete)
    add_cube("Wall_EastBay_South", (13.3, -3.6, 2.4), (8.0, 0.35, 4.8), concrete)
    add_cube("Wall_EastBay_End", (17.3, 0.0, 2.4), (0.35, 7.2, 4.8), concrete)

    add_cube("Wall_South_West", (-3.6, -12.8, 1.15), (0.3, 7.0, 2.3), concrete)
    add_cube("Wall_South_East", (3.6, -12.8, 1.15), (0.3, 7.0, 2.3), concrete)
    add_cube("Wall_West_North", (-13.2, 4.0, 1.35), (7.6, 0.3, 1.5), concrete)
    add_cube("Wall_West_South", (-13.2, -4.0, 1.35), (7.6, 0.3, 1.5), concrete)

    for index, (x, y) in enumerate(((-8.15, -8.15), (8.15, -8.15), (8.15, 8.15), (-8.15, 8.15))):
        add_cylinder(
            f"Pillar_{index:02d}",
            (x, y, 3.2),
            0.38,
            6.4,
            (0.0, 0.0, 0.0),
            concrete,
        )

    crates = (
        (0, (-3.1, 1.6), 1.15),
        (1, (-2.15, 2.35), 0.72),
        (2, (3.6, -2.4), 1.25),
        (3, (1.1, 4.6), 0.9),
        (4, (12.4, 0.8), 1.2),
        (5, (14.0, -1.4), 0.95),
        (6, (13.55, -0.85), 0.62),
        (7, (15.4, 1.7), 0.8),
    )
    for index, xy, size in crates:
        z = 0.05
        if index == 1:
            z = 1.15
        if index == 6:
            z = 0.95
        add_radianite_crate(index, (xy[0], xy[1], z), size, body, trim)

    # Camera anchors. glTF Y-up conversion is applied on export; readers should
    # use the exported node positions rather than these Blender coordinates.
    add_empty("Cam_Menu", (-17.2, -5.4, 3.8))
    add_empty("Look_Menu", (1.4, 1.2, 1.7))
    add_empty("Cam_Projects", (0.2, 17.6, 2.15))
    add_empty("Look_Projects", (0.0, 10.2, 1.7))
    add_empty("Cam_Skills", (15.8, 2.5, 1.85))
    add_empty("Look_Skills", (13.2, -0.4, 0.8))
    add_empty("Cam_Contact", (0.4, -15.0, 1.7))
    add_empty("Look_Contact", (0.0, -9.0, 2.5))

    cyan = (0.0, 1.0, 1.0)
    red = (1.0, 0.07, 0.16)
    add_point_light("Light_Cyan_North_A", (1.35, 7.55, 2.9), cyan, 900)
    add_point_light("Light_Cyan_North_B", (-1.35, 7.55, 2.5), cyan, 700)
    add_point_light("Light_Cyan_East", (7.55, 1.2, 2.7), cyan, 1100)
    add_point_light("Light_Red_South_A", (1.3, -7.55, 2.45), red, 1000)
    add_point_light("Light_Red_South_B", (-1.3, -7.55, 2.15), red, 760)
    add_point_light("Light_Red_West", (-7.55, 0.4, 3.05), red, 980)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format="GLB",
        export_apply=True,
        export_lights=True,
        export_yup=True,
        export_cameras=False,
        export_materials="EXPORT",
    )
    if not os.path.isfile(OUT_PATH) or os.path.getsize(OUT_PATH) < 1000:
        raise RuntimeError(f"glTF export did not write a valid file at {OUT_PATH}")
    print(f"EXPORT_OK {OUT_PATH} {os.path.getsize(OUT_PATH)}")


if __name__ == "__main__":
    build()
