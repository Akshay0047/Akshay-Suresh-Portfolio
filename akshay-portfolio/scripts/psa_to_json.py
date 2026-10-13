"""Convert an Unreal ActorX .psa into a compact JSON clip (pure Python, no Blender).

    python scripts/psa_to_json.py in.psa out.json [--report]

Output: {fps, frames, bones: [{name, parent, restQuat, restPos}], tracks: {bone: {q: [...], p: [...]}}}
Quaternions are stored xyzw exactly as in the file (UE left-handed, bone-local).
"""

import json
import math
import struct
import sys

src, dst = sys.argv[1], sys.argv[2]
data = open(src, "rb").read()
pos = 0
chunks = {}
while pos + 32 <= len(data):
    cid = data[pos : pos + 20].split(b"\0")[0].decode("ascii", "replace")
    _, size, count = struct.unpack_from("<iii", data, pos + 20)
    pos += 32
    chunks[cid] = (pos, size, count)
    pos += size * count

start, size, count = chunks["BONENAMES"]
bones = []
for i in range(count):
    off = start + i * size
    name = data[off : off + 64].split(b"\0")[0].decode("ascii", "replace")
    _, _, parent = struct.unpack_from("<iii", data, off + 64)
    q = struct.unpack_from("<4f", data, off + 76)
    p = struct.unpack_from("<3f", data, off + 92)
    bones.append({"name": name, "parent": parent, "restQuat": [round(v, 5) for v in q], "restPos": [round(v, 4) for v in p]})

start, size, count = chunks["ANIMINFO"]
off = start
frames = struct.unpack_from("<i", data, off + 128 + 4 * 9)[0]
fps = struct.unpack_from("<f", data, off + 128 + 4 * 6)[0]

kstart, ksize, kcount = chunks["ANIMKEYS"]
tracks = {b["name"]: {"q": [], "p": []} for b in bones}
for f in range(frames):
    for i, b in enumerate(bones):
        off = kstart + (f * len(bones) + i) * ksize
        px, py, pz, qx, qy, qz, qw, _ = struct.unpack_from("<3f4ff", data, off)
        tracks[b["name"]]["q"].append([round(qx, 5), round(qy, 5), round(qz, 5), round(qw, 5)])
        tracks[b["name"]]["p"].append([round(px, 4), round(py, 4), round(pz, 4)])

clip = {"fps": round(fps, 3), "frames": frames, "bones": bones, "tracks": tracks}
json.dump(clip, open(dst, "w"), separators=(",", ":"))
print("WROTE", dst, "frames", frames, "fps", fps, "bones", len(bones))

if "--report" in sys.argv:
    def angle(a, b):
        d = abs(sum(x * y for x, y in zip(a, b)))
        return math.degrees(2 * math.acos(min(1.0, d)))

    for name, t in tracks.items():
        if name in ("Skeleton", "Root"):
            continue
        amp = max(angle(q, t["q"][0]) for q in t["q"])
        move = max(math.dist(p, t["p"][0]) for p in t["p"])
        if amp > 3 or move > 0.05:
            print(f"{name:20s} maxRotDeg={amp:7.1f} maxMove={move:8.3f}")
