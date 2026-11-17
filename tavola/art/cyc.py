"""Top-down path-traced renderer for height/material map sets (Blender Cycles as a library).

Everything on a plate is authored in 2-D as a height field plus material maps
(see kit.py). This module turns those maps into a displaced mesh and lights it
like a flat-lay food shoot: an orthographic camera straight above, a soft key
from the upper left, and a ring of fill so nothing reads as "rotated wrongly"
when the plate turns on the table.
"""
from __future__ import annotations

import os
import tempfile
import time

import bpy
import numpy as np


def _image(name: str, arr: np.ndarray):
    h, w = arr.shape[:2]
    if arr.ndim == 2:
        arr = np.repeat(arr[..., None], 3, -1)
    if arr.shape[2] == 3:
        arr = np.concatenate([arr, np.ones((h, w, 1), np.float32)], -1)
    img = bpy.data.images.new(name, w, h, alpha=True, float_buffer=True)
    img.colorspace_settings.name = "Non-Color"
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1], dtype=np.float32).ravel())
    return img


def _grid_mesh(height: np.ndarray, step: int = 1):
    """Height field -> quad mesh spanning [-1, 1]^2. Row 0 of the array is the top (+y)."""
    hgt = height[::step, ::step] if step > 1 else height
    n = hgt.shape[0]
    xs = (np.arange(n, dtype=np.float32) + 0.5) / n * 2 - 1
    X, Y = np.meshgrid(xs, -xs)
    co = np.stack([X, Y, hgt.astype(np.float32)], -1).reshape(-1, 3)
    idx = np.arange(n * n, dtype=np.int32).reshape(n, n)
    quads = np.stack([idx[:-1, :-1], idx[1:, :-1], idx[1:, 1:], idx[:-1, 1:]], -1).reshape(-1, 4)
    nq = len(quads)
    me = bpy.data.meshes.new("field")
    me.vertices.add(n * n)
    me.vertices.foreach_set("co", co.ravel())
    me.loops.add(nq * 4)
    me.loops.foreach_set("vertex_index", quads.ravel())
    me.polygons.add(nq)
    me.polygons.foreach_set("loop_start", np.arange(0, nq * 4, 4, dtype=np.int32))
    me.polygons.foreach_set("loop_total", np.full(nq, 4, np.int32))
    me.polygons.foreach_set("use_smooth", np.ones(nq, bool))
    uv = me.uv_layers.new(name="UVMap")
    U = (X + 1) / 2
    V = (Y + 1) / 2
    uvv = np.stack([U, V], -1).reshape(-1, 2)[quads.ravel()]
    uv.data.foreach_set("uv", uvv.astype(np.float32).ravel())
    me.update()
    return me


def _material(maps: dict, sss_scale: float):
    mat = bpy.data.materials.new("food")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    def tex(name, arr):
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = _image(name, arr)
        node.interpolation = "Cubic"
        node.extension = "EXTEND"
        return node

    col = tex("albedo", maps["col"])
    nt.links.new(col.outputs["Color"], bsdf.inputs["Base Color"])

    # r = roughness, g = subsurface weight, b = coat weight
    prm = tex("params", np.stack([maps["rough"], maps["sss"], maps["coat"]], -1))
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(prm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Red"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Subsurface Weight"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Coat Weight"])

    # r = specular level, g = alpha, b = sheen
    prm2 = tex("params2", np.stack([maps["spec"], maps["alpha"], maps["sheen"]], -1))
    sep2 = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(prm2.outputs["Color"], sep2.inputs["Color"])
    nt.links.new(sep2.outputs["Red"], bsdf.inputs["Specular IOR Level"])
    nt.links.new(sep2.outputs["Green"], bsdf.inputs["Alpha"])
    nt.links.new(sep2.outputs["Blue"], bsdf.inputs["Sheen Weight"])

    rad = tex("sssradius", maps["sssr"])
    nt.links.new(rad.outputs["Color"], bsdf.inputs["Subsurface Radius"])
    bsdf.inputs["Subsurface Scale"].default_value = sss_scale
    bsdf.inputs["Coat Roughness"].default_value = 0.06
    bsdf.inputs["Sheen Roughness"].default_value = 0.5
    bsdf.subsurface_method = "RANDOM_WALK"
    return mat


def _world(fill: float, floor=(0.62, 0.56, 0.5)):
    world = bpy.data.worlds.new("studio")
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    mp = nt.nodes.new("ShaderNodeMapRange")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], mp.inputs["Value"])
    mp.inputs["From Min"].default_value = -1
    mp.inputs["From Max"].default_value = 1
    nt.links.new(mp.outputs["Result"], ramp.inputs["Fac"])
    # elevation profile: warm bounce from the cloth below, a bright band of
    # softboxes around the set, and a dim ceiling so flat glazes don't glare
    els = ramp.color_ramp.elements
    els[0].position = 0.0
    els[0].color = (*[c * 0.35 for c in floor], 1)
    els[1].position = 1.0
    els[1].color = (0.16, 0.16, 0.17, 1)
    for pos, v in ((0.5, 0.45), (0.62, 1.0), (0.8, 1.05), (0.93, 0.5)):
        e = els.new(pos)
        e.color = (v, v, v * 1.02, 1)
    els2 = [e for e in els]
    for e in els2:
        if abs(e.position - 0.5) < 1e-3:
            e.color = (*[c * 0.55 for c in floor], 1)
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = fill
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return world


def render(maps: dict, res: int, spp: int = 96, mesh_step: int = 1, key: float = 1.0,
           fill: float = 1.0, sss_scale: float = 0.012, key_dir=(-0.62, 0.62, 1.0),
           key_size: float = 2.6, threads: int = 0) -> np.ndarray:
    """Returns linear RGBA float32 (res x res x 4), row 0 = top."""
    t0 = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    cy = scene.cycles
    cy.device = "CPU"
    cy.samples = spp
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.02
    cy.use_denoising = True
    cy.max_bounces = 6
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 3
    cy.transmission_bounces = 2
    cy.transparent_max_bounces = 4
    cy.sample_clamp_indirect = 6.0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    scene.render.threads_mode = "FIXED" if threads else "AUTO"
    if threads:
        scene.render.threads = threads
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "32"
    scene.view_settings.view_transform = "Raw"
    scene.world = _world(0.26 * fill)

    me = _grid_mesh(maps["h"], mesh_step)
    ob = bpy.data.objects.new("field", me)
    scene.collection.objects.link(ob)
    me.materials.append(_material(maps, sss_scale))

    cam = bpy.data.cameras.new("cam")
    cam.type = "ORTHO"
    cam.ortho_scale = 2.0
    cam.clip_end = 100
    camo = bpy.data.objects.new("cam", cam)
    camo.location = (0, 0, 10)
    scene.collection.objects.link(camo)
    scene.camera = camo

    d = np.array(key_dir, dtype=np.float64)
    d /= np.linalg.norm(d)
    light = bpy.data.lights.new("key", "AREA")
    light.shape = "DISK"
    light.size = key_size
    light.energy = 300 * key
    light.color = (1.0, 0.965, 0.93)
    lo = bpy.data.objects.new("key", light)
    lo.location = tuple(d * 4.6)
    # aim -Z of the lamp at the origin
    from mathutils import Vector
    lo.rotation_euler = Vector(tuple(-d)).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(lo)

    path = os.path.join(tempfile.mkdtemp(prefix="cyc"), "out.exr")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path)
    buf = np.empty(res * res * 4, np.float32)
    img.pixels.foreach_get(buf)
    out = buf.reshape(res, res, 4)[::-1].copy()
    os.remove(path)
    print(f"[cycles] {res}px {spp}spp in {time.time() - t0:.1f}s", flush=True)
    return out
