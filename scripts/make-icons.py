"""Generates the PWA icons (pure Python, no dependencies). Run: python3 scripts/make-icons.py
The mark matches the site logo: a phosphor-green square with a dark prompt chevron and cursor."""
import struct, zlib, pathlib

GREEN, DARK = (57, 255, 122), (3, 18, 8)
OUT = pathlib.Path(__file__).resolve().parent.parent / 'icons'

def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return ((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2) ** 0.5

def glyph(u, v, scale):
    """True if the unit-square point (u, v) is on the chevron or the cursor bar. `scale` shrinks the mark toward the centre."""
    u = (u - 0.5) / scale + 0.5; v = (v - 0.5) / scale + 0.5
    w = 0.075
    if seg_dist(u, v, 0.27, 0.30, 0.50, 0.50) <= w or seg_dist(u, v, 0.27, 0.70, 0.50, 0.50) <= w: return True
    return 0.56 <= u <= 0.78 and 0.65 <= v <= 0.73

def render(size, kind):
    """kind 'any': black margin around a green square. kind 'maskable': full-bleed green, mark inside the safe zone."""
    ss, rows = 3, []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            hits = 0
            for sy in range(ss):
                for sx in range(ss):
                    u, v = (x + (sx + .5) / ss) / size, (y + (sy + .5) / ss) / size
                    if kind == 'maskable': on = glyph(u, v, 0.62)
                    else:
                        inside = 0.10 <= u <= 0.90 and 0.10 <= v <= 0.90
                        on = inside and glyph((u - 0.10) / 0.80, (v - 0.10) / 0.80, 1.0)
                    hits += on
            f = hits / (ss * ss)
            if kind == 'maskable': base = GREEN
            else: base = GREEN if (0.10 <= (x + .5) / size <= 0.90 and 0.10 <= (y + .5) / size <= 0.90) else (4, 7, 5)
            row += bytes(round(base[i] * (1 - f) + DARK[i] * f) for i in range(3))
        rows.append(b'\x00' + bytes(row))
    raw = b''.join(rows)
    def chunk(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')

for name, size, kind in [('icon-192.png', 192, 'any'), ('icon-512.png', 512, 'any'), ('icon-maskable-512.png', 512, 'maskable'), ('apple-touch-icon.png', 180, 'maskable')]:
    (OUT / name).write_bytes(render(size, kind)); print('wrote', name)
