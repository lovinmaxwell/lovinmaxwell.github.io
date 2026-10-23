"""Render an original silver ribbon without modifying the user's Blender scene."""
from pathlib import Path
from math import cos, sin, pi
import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
archive = root / ".design-refs"
archive.mkdir(exist_ok=True)
scene = bpy.data.scenes.new("Portfolio_Orbital_Ribbon")
scene.render.engine = "CYCLES"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.render.resolution_x = 1200
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.filepath = str(archive / "orbital-ribbon.png")
scene.world = bpy.data.worlds.new("Ribbon_Studio")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.35, .35, .35, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .45

def center(t):
    radius = 1.65 + .62 * cos(3 * t)
    return Vector((radius * cos(2 * t), radius * sin(2 * t), .78 * sin(3 * t)))

vertices, faces = [], []
steps, sides = 480, 24
for i in range(steps):
    t = i / steps * 2 * pi
    point = center(t)
    tangent = (center(t + .001) - center(t - .001)).normalized()
    normal = tangent.cross(Vector((0, 0, 1))).normalized()
    binormal = tangent.cross(normal).normalized()
    twist = t * 3
    width_axis = normal * cos(twist) + binormal * sin(twist)
    depth_axis = -normal * sin(twist) + binormal * cos(twist)
    for j in range(sides):
        angle = j / sides * 2 * pi
        vertices.append(point + width_axis * (.24 * cos(angle)) + depth_axis * (.09 * sin(angle)))
        faces.append((i * sides + j, i * sides + (j + 1) % sides,
                      ((i + 1) % steps) * sides + (j + 1) % sides,
                      ((i + 1) % steps) * sides + j))
mesh = bpy.data.meshes.new("Continuous_Ribbon")
mesh.from_pydata(vertices, [], faces)
mesh.update()
for polygon in mesh.polygons:
    polygon.use_smooth = True
sculpture = bpy.data.objects.new("Orbital_Ribbon", mesh)
scene.collection.objects.link(sculpture)
material = bpy.data.materials.new("Brushed_Silver")
material.use_nodes = True
shader = material.node_tree.nodes["Principled BSDF"]
shader.inputs["Base Color"].default_value = (.62, .64, .67, 1)
shader.inputs["Metallic"].default_value = .94
shader.inputs["Roughness"].default_value = .24
mesh.materials.append(material)

def point_at(obj):
    obj.rotation_euler = (-obj.location).to_track_quat("-Z", "Y").to_euler()

for name, location, power, size in [
    ("Key", (1, -4, 6), 1600, 5),
    ("Fill", (-5, -1, 2), 1100, 4),
    ("Rim", (3, 4, 3), 1900, 3),
]:
    data = bpy.data.lights.new("Ribbon_" + name, "AREA")
    data.energy, data.shape, data.size = power, "DISK", size
    light = bpy.data.objects.new("Ribbon_" + name, data)
    scene.collection.objects.link(light)
    light.location = location
    point_at(light)
camera = bpy.data.objects.new("Ribbon_Camera", bpy.data.cameras.new("Ribbon_Camera"))
scene.collection.objects.link(camera)
camera.location = (3, -6, 7)
point_at(camera)
camera.data.type = "ORTHO"
camera.data.ortho_scale = 5.8
scene.camera = camera
bpy.ops.render.render(write_still=True, scene=scene.name)
print("Rendered:", scene.render.filepath)
