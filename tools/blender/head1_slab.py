import json
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[2]
HALF_THICKNESS = 10.0

contour = json.loads((ROOT / "tools/blender/head1_contour.json").read_text())[0]
points = [(x, -y) for x, y in contour]

area = sum(
    points[i][0] * points[(i + 1) % len(points)][1]
    - points[(i + 1) % len(points)][0] * points[i][1]
    for i in range(len(points))
)

if area < 0:
    points.reverse()

bm = bmesh.new()

front = [bm.verts.new((x, y, HALF_THICKNESS)) for x, y in points]
front_face = bm.faces.new(front)
bmesh.ops.triangulate(bm, faces=[front_face], quad_method="BEAUTY", ngon_method="EAR_CLIP")

back = [bm.verts.new((x, y, -HALF_THICKNESS)) for x, y in points]
back_face = bm.faces.new(list(reversed(back)))
bmesh.ops.triangulate(bm, faces=[back_face], quad_method="BEAUTY", ngon_method="EAR_CLIP")

for i in range(len(points)):
    j = (i + 1) % len(points)
    bm.faces.new((front[i], back[i], back[j], front[j]))

bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) == 4])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

mesh = bpy.data.meshes.new("Head1Slab")
bm.to_mesh(mesh)
bm.free()

uv_layer = mesh.uv_layers.new(name="UV")

for polygon in mesh.polygons:
    for loop_index in polygon.loop_indices:
        co = mesh.vertices[mesh.loops[loop_index].vertex_index].co
        uv_layer.data[loop_index].uv = ((co.x + 64) / 128, (co.y + 64) / 128)

mesh.calc_loop_triangles()

triangles = []

for triangle in mesh.loop_triangles:
    vertices = []

    for loop_index, vertex_index in zip(triangle.loops, triangle.vertices):
        co = mesh.vertices[vertex_index].co
        uv = uv_layer.data[loop_index].uv

        vertices.append(
            {
                "p": [round(co.x, 3), round(co.y, 3), round(co.z, 3)],
                "uv": [round(uv[0], 5), round(uv[1], 5)],
            }
        )

    triangles.append({"n": [round(c, 4) for c in triangle.normal], "v": vertices})

(ROOT / "tools/icon_mesh.json").write_text(json.dumps(triangles))
print("triangles", len(triangles))
