"""Dump basic information from an Unreal ActorX .psa animation file (no Blender needed)."""

import struct
import sys

path = sys.argv[1]
data = open(path, "rb").read()
pos = 0
chunks = {}
while pos + 32 <= len(data):
    chunk_id = data[pos : pos + 20].split(b"\0")[0].decode("ascii", "replace")
    type_flag, size, count = struct.unpack_from("<iii", data, pos + 20)
    pos += 32
    chunks[chunk_id] = (pos, size, count)
    print(chunk_id, type_flag, size, count)
    pos += size * count

start, size, count = chunks["BONENAMES"]
bones = []
for i in range(count):
    off = start + i * size
    name = data[off : off + 64].split(b"\0")[0].decode("ascii", "replace")
    flags, children, parent = struct.unpack_from("<iii", data, off + 64)
    quat = struct.unpack_from("<4f", data, off + 76)
    p = struct.unpack_from("<3f", data, off + 92)
    bones.append((name, parent, quat, p))
print("BONES", count)
for i, b in enumerate(bones[:12]):
    print(i, b)
print([b[0] for b in bones])

start, size, count = chunks["ANIMINFO"]
for i in range(count):
    off = start + i * size
    name = data[off : off + 64].split(b"\0")[0].decode("ascii", "replace")
    vals = struct.unpack_from("<iiiiffffiii", data, off + 128)
    print("ANIM", name, vals)

start, size, count = chunks["ANIMKEYS"]
print("KEYS", count, size)
for i in range(3):
    off = start + i * size
    print(struct.unpack_from("<3f4ff", data, off))
