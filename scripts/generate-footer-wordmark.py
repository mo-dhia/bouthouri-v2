"""Offline Questrial-derived wordmark face; no browser/runtime dependency.

Requires FontTools 4.60.1 and system libfreetype. Run this script, then
`bun scripts/generate-footer-glyphs.mjs`. The upstream OFL remains beside the
font, and the derivative uses its own family name. Strength is in font units.
"""
import ctypes as c
import ctypes.util
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.ttLib.tables.ttProgram import Program

ROOT = Path(__file__).resolve().parent.parent
STRENGTH = 20
font = TTFont(ROOT / "public/assets/textures/questrial-studio.woff", recalcTimestamp=False)
options = subset.Options()
options.hinting = False
options.layout_features = []
subsetter = subset.Subsetter(options=options)
subsetter.populate(text="BOUTHOURI ")
subsetter.subset(font)


class Vector(c.Structure):
    _fields_ = [("x", c.c_long), ("y", c.c_long)]


class Outline(c.Structure):
    _fields_ = [
        ("n_contours", c.c_short), ("n_points", c.c_short),
        ("points", c.POINTER(Vector)), ("tags", c.POINTER(c.c_ubyte)),
        ("contours", c.POINTER(c.c_short)), ("flags", c.c_int),
    ]


ft = c.CDLL(ctypes.util.find_library("freetype"))
ft.FT_Outline_Embolden.argtypes = [c.POINTER(Outline), c.c_long]
ft.FT_Outline_Embolden.restype = c.c_int

for name in font.getGlyphOrder():
    glyph = font["glyf"][name]
    if not glyph.numberOfContours:
        continue
    assert glyph.numberOfContours > 0, "The wordmark must use simple outlines"
    coordinates, ends, flags = glyph.getCoordinates(font["glyf"])
    points = (Vector * len(coordinates))(*(Vector(x * 64, y * 64) for x, y in coordinates))
    tags = (c.c_ubyte * len(flags))(*(flag & 1 for flag in flags))
    contours = (c.c_short * len(ends))(*ends)
    outline = Outline(len(ends), len(coordinates), points, tags, contours, 0)
    error = ft.FT_Outline_Embolden(c.byref(outline), STRENGTH * 64)
    assert error == 0, (name, error)
    glyph.coordinates = GlyphCoordinates((round(p.x / 64), round(p.y / 64)) for p in points)
    glyph.program = Program()
    glyph.program.fromBytecode([])
    glyph.recalcBounds(font["glyf"])
    advance, _ = font["hmtx"][name]
    font["hmtx"][name] = (advance + STRENGTH, glyph.xMin)

names = {
    1: "Bouthouri Wordmark", 2: "Regular", 3: "BouthouriWordmark-20-1.000",
    4: "Bouthouri Wordmark", 5: "Version 1.000", 6: "BouthouriWordmark-Regular",
    16: "Bouthouri Wordmark", 17: "Regular",
}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = "woff"
destination = ROOT / "public/assets/fonts/bouthouri-wordmark.woff"
font.save(destination)
print(json.dumps({"font": str(destination.relative_to(ROOT)), "bytes": destination.stat().st_size, "strength": STRENGTH}))
