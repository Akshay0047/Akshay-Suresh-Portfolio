"""Print a compact JSON report (armatures, hand/weapon bones, bounds, actions) for every .blend.

    blender --background --python scripts/inspect_blends.py -- out.json
"""

import json
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))
OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else None

report = {}
for name in sorted(os.listdir(ROOT)):
    if not name.endswith(".blend") or name == "havenA.blend":
        continue
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, name))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    low = Vector((1e9,) * 3)
    high = Vector((-1e9,) * 3)
    for o in meshes:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            low = Vector(min(low[i], p[i]) for i in range(3))
            high = Vector(max(high[i], p[i]) for i in range(3))
    info = {
        "meshes": [(o.name, len(o.data.vertices), o.hide_viewport or o.hide_render) for o in meshes],
        "boundsMin": [round(v, 2) for v in low],
        "boundsMax": [round(v, 2) for v in high],
        "actions": [(a.name, [round(v, 1) for v in a.frame_range]) for a in bpy.data.actions],
        "armatures": [],
    }
    for a in arms:
        bones = a.data.bones
        names = [b.name for b in bones]
        interesting = [n for n in names if any(k in n.lower() for k in ("hand", "weapon", "gun", "socket", "wrist", "palm"))]
        roots = [b.name for b in bones if b.parent is None]
        info["armatures"].append(
            {
                "name": a.name,
                "bones": len(names),
                "roots": roots,
                "interesting": interesting[:24],
                "sample": names[:14],
                "scale": [round(v, 3) for v in a.scale],
                "rot": [round(v, 2) for v in a.rotation_euler],
                "parent": a.parent.name if a.parent else None,
            }
        )
    report[name] = info

text = json.dumps(report, indent=1)
if OUT:
    with open(OUT, "w") as handle:
        handle.write(text)
print("INSPECT_DONE")
