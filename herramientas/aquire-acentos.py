"""Añade a Aquire las vocales con tilde, la Ñ y la Ü (la fuente las dibuja sin acento)."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.boundsPen import BoundsPen

src, dst = sys.argv[1], sys.argv[2]
t = TTFont(src)
cff = t["CFF "].cff
top = cff.topDictIndex[0]
assert not hasattr(top, "FDArray"), "fuente CID: no soportada"
cs = top.CharStrings
gs = t.getGlyphSet()
cmap_tables = [s for s in t["cmap"].tables if s.isUnicode()]

def caja(nombre):
    p = BoundsPen(gs); gs[nombre].draw(p); return p.bounds

xi0, _, xi1, cap = caja("I")
grosor = xi1 - xi0                     # grosor del asta
t_acento = grosor * 0.78
hueco = max(40, grosor * 0.45)
y0 = cap + hueco

def poligono(pen, puntos):
    pen.moveTo(puntos[0])
    for p in puntos[1:]:
        pen.lineTo(p)
    pen.closePath()

def agudo(pen, cx):
    alto = t_acento * 1.25 + 40
    dx = alto * 0.55
    x0 = cx - dx / 2 - t_acento / 2
    poligono(pen, [(x0, y0), (x0 + t_acento, y0), (x0 + t_acento + dx, y0 + alto), (x0 + dx, y0 + alto)])

def virgulilla(pen, cx, ancho):
    # Zigzag anguloso (bajo-alto-bajo-alto), en la línea geométrica de la fuente
    w = max(ancho * 0.62, grosor * 3.2)
    amp = t_acento * 0.9 + 30
    xs = [cx - w / 2, cx - w / 6, cx + w / 6, cx + w / 2]
    ys = [y0, y0 + amp, y0, y0 + amp]
    abajo = list(zip(xs, ys))
    arriba = [(x, y + t_acento) for x, y in reversed(abajo)]
    poligono(pen, abajo + arriba)

def dieresis(pen, cx, ancho):
    lado = t_acento
    sep = max(ancho * 0.18, lado * 1.1)
    for c in (cx - sep, cx + sep):
        poligono(pen, [(c - lado / 2, y0), (c + lado / 2, y0), (c + lado / 2, y0 + lado), (c - lado / 2, y0 + lado)])

NUEVOS = {  # nombre: (base, acento, [códigos])
    "Aacute": ("A", "agudo", [0xC1, 0xE1]), "Eacute": ("E", "agudo", [0xC9, 0xE9]),
    "Iacute": ("I", "agudo", [0xCD, 0xED]), "Oacute": ("O", "agudo", [0xD3, 0xF3]),
    "Uacute": ("U", "agudo", [0xDA, 0xFA]), "Ntilde": ("N", "tilde", [0xD1, 0xF1]),
    "Udieresis": ("U", "dieresis", [0xDC, 0xFC]),
}
orden = t.getGlyphOrder()
for nombre, (base, acento, codigos) in NUEVOS.items():
    if nombre in orden:
        nombre += ".jm"
    ancho_avance, lsb = t["hmtx"].metrics[base]
    x0, _, x1, _ = caja(base)
    cx, ancho = (x0 + x1) / 2, x1 - x0
    pen = T2CharStringPen(ancho_avance, gs)
    gs[base].draw(pen)
    {"agudo": lambda: agudo(pen, cx), "tilde": lambda: virgulilla(pen, cx, ancho), "dieresis": lambda: dieresis(pen, cx, ancho)}[acento]()
    c = pen.getCharString(private=top.Private, globalSubrs=cff.GlobalSubrs)
    if cs.charStringsAreIndexed:
        cs.charStringsIndex.append(c); cs.charStrings[nombre] = len(cs.charStringsIndex) - 1
    else:
        cs.charStrings[nombre] = c
    top.charset.append(nombre)
    orden.append(nombre)
    t["hmtx"].metrics[nombre] = (ancho_avance, lsb)
    for tabla in cmap_tables:
        for cod in codigos:
            tabla.cmap[cod] = nombre
t.setGlyphOrder(orden)
t.flavor = "woff2"
t.save(dst)
print(dst.split("/")[-1], "asta", round(grosor), "cap", round(cap), "acento", round(t_acento))
