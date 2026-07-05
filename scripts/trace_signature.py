"""Trace signature PNG centerline and export SVG path."""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize

ROOT = Path(__file__).resolve().parents[1]
IMG_PATH = ROOT / "assets" / "signature.png"
OUT_PATH = ROOT / "assets" / "signature-path.json"


def load_binary() -> np.ndarray:
    img = np.array(Image.open(IMG_PATH).convert("L"))
    _, binary = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return binary > 0


def neighbors(y: int, x: int, skel: np.ndarray) -> list[tuple[int, int]]:
    h, w = skel.shape
    pts = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy == 0 and dx == 0:
                continue
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and skel[ny, nx]:
                pts.append((ny, nx))
    return pts


def edge_key(a: tuple[int, int], b: tuple[int, int]) -> tuple[tuple[int, int], tuple[int, int]]:
    return (a, b) if a <= b else (b, a)


def trace_eulerian_path(skel: np.ndarray) -> list[tuple[int, int]]:
    pts = [(int(y), int(x)) for y, x in zip(*np.where(skel))]
    pt_set = set(pts)

    adj: dict[tuple[int, int], list[tuple[int, int]]] = defaultdict(list)
    edges: set[tuple[tuple[int, int], tuple[int, int]]] = set()

    for y, x in pts:
        for ny, nx in neighbors(y, x, skel):
            if (ny, nx) not in pt_set:
                continue
            key = edge_key((y, x), (ny, nx))
            if key not in edges:
                edges.add(key)
                adj[(y, x)].append((ny, nx))
                adj[(ny, nx)].append((y, x))

    endpoints = [p for p in pts if len(adj[p]) == 1]
    start = max(endpoints, key=lambda p: (p[0], -p[1])) if endpoints else pts[0]

    stack = [start]
    path = [start]
    used: set[tuple[tuple[int, int], tuple[int, int]]] = set()

    while stack:
        current = stack[-1]
        next_node = None
        for nxt in adj[current]:
            key = edge_key(current, nxt)
            if key not in used:
                next_node = nxt
                used.add(key)
                break

        if next_node is None:
            stack.pop()
            if stack:
                path.append(stack[-1])
        else:
            stack.append(next_node)
            path.append(next_node)

    return path


def subsample(points: list[tuple[int, int]], step: int = 3) -> list[tuple[int, int]]:
    if len(points) <= 2:
        return points
    out = [points[0]]
    for i in range(step, len(points) - 1, step):
        out.append(points[i])
    if out[-1] != points[-1]:
        out.append(points[-1])
    return out


def smooth(points: list[tuple[float, float]], window: int = 5) -> list[tuple[float, float]]:
    if len(points) < window:
        return points
    half = window // 2
    smoothed = []
    for i in range(len(points)):
        ys = [points[j][0] for j in range(max(0, i - half), min(len(points), i + half + 1))]
        xs = [points[j][1] for j in range(max(0, i - half), min(len(points), i + half + 1))]
        smoothed.append((sum(ys) / len(ys), sum(xs) / len(xs)))
    return smoothed


def to_polyline_path(svg_pts: list[tuple[float, float]]) -> str:
    if not svg_pts:
        return ""
    parts = [f"M {svg_pts[0][0]:.1f} {svg_pts[0][1]:.1f}"]
    parts.extend(f"L {x:.1f} {y:.1f}" for x, y in svg_pts[1:])
    return " ".join(parts)


def main() -> None:
    binary = load_binary()
    skel = skeletonize(binary)
    raw = trace_eulerian_path(skel)
    raw = subsample(raw, step=3)
    pts = smooth([(float(y), float(x)) for y, x in raw], window=5)
    svg_pts = [(x, y) for y, x in pts]
    poly_d = to_polyline_path(svg_pts)

    data = {
        "viewBox": "0 0 1024 674",
        "pointCount": len(svg_pts),
        "start": list(svg_pts[0]),
        "end": list(svg_pts[-1]),
        "polylinePath": poly_d,
    }

    OUT_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")

    js_path = ROOT / "js" / "signature-path.js"
    js_path.write_text(
        f"const SIGNATURE_PATH = {json.dumps(poly_d)};\n"
        f"const SIGNATURE_START = {json.dumps(data['start'])};\n",
        encoding="utf-8",
    )

    print(f"Wrote {OUT_PATH}")
    print(f"Wrote {js_path}")
    print(f"Points: {len(svg_pts)}")
    print(f"Start: {svg_pts[0]}")
    print(f"End: {svg_pts[-1]}")


if __name__ == "__main__":
    main()
