# แบนเนอร์ช่อง YouTube Cardz Center (2048x1152) — สไตล์เดียวกับปก Facebook
# พื้นที่ปลอดภัยมือถือ 1235x338 กลางภาพ (x 406-1641, y 407-745) ข้อความอยู่ในนี้ การ์ดอยู่สองข้าง
# ใช้: python3 fb_cover_compose.py out.png fonts_dir card1 card2 card3 card4
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT, FD = sys.argv[1], sys.argv[2].rstrip("/") + "/"
CARDS = sys.argv[3:7]
W, H = 2048, 1152
GOLD = (255, 204, 92)
KS = FD + "Kanit-SemiBold.ttf"; KB = FD + "Kanit-Bold.ttf"; KX = FD + "Kanit-ExtraBold.ttf"
PB = FD + "Poppins-Bold.ttf"; PM = FD + "Poppins-Medium.ttf"
F = lambda p, s: ImageFont.truetype(p, s)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def vgrad(w, h, stops):
    arr = np.zeros((h, w, 3), np.float32)
    ys = np.linspace(0, 1, h)
    for i in range(len(stops) - 1):
        (t0, c0), (t1, c1) = stops[i], stops[i + 1]
        m = (ys >= t0) & (ys <= t1)
        t = ((ys[m] - t0) / max(t1 - t0, 1e-6))[:, None]
        arr[m] = (np.array(c0) * (1 - t) + np.array(c1) * t)[:, None, :]
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGB").convert("RGBA")


def glow_layer(size, shapes, blur):
    g = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    for kind, box, col in shapes:
        getattr(d, kind)(box, fill=col)
    return g.filter(ImageFilter.GaussianBlur(blur))


def perspective(img, dst, size):
    w, h = img.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        B += [u, v]
    co = np.linalg.solve(np.array(A, float), np.array(B, float))
    return img.transform(size, Image.PERSPECTIVE, tuple(co), Image.BICUBIC)


def acrylic_case(card, cw):
    """การ์ดในเคสอะคริลิก + ฐานตั้ง คืนภาพ RGBA"""
    ch = int(cw * card.height / card.width)
    card = card.convert("RGBA").resize((cw, ch), Image.LANCZOS)
    m = int(cw * 0.085); base = int(cw * 0.11)
    W2, H2 = cw + 2 * m, ch + 2 * m + base
    im = Image.new("RGBA", (W2, H2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    r = int(cw * 0.05)
    # ตัวเคสใส
    d.rounded_rectangle((0, 0, W2 - 1, H2 - base - 1), radius=r, fill=(200, 225, 255, 34))
    # เงาการ์ดในเคส + การ์ด (มุมมนเล็กน้อย)
    mask = Image.new("L", card.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=int(cw * 0.035), fill=255)
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.paste((0, 0, 0, 150), (m + 4, m + 8), mask)
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    im.paste(card, (m, m), mask)
    # ขอบเคสเงาสะท้อน
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, W2 - 1, H2 - base - 1), radius=r, outline=(225, 240, 255, 210), width=max(3, cw // 120))
    d.rounded_rectangle((m // 3, m // 3, W2 - 1 - m // 3, H2 - base - 1 - m // 3), radius=int(r * 0.8), outline=(255, 255, 255, 60), width=2)
    # น็อตสี่มุม
    for cx, cy in ((m // 2, m // 2), (W2 - m // 2, m // 2), (m // 2, H2 - base - m // 2), (W2 - m // 2, H2 - base - m // 2)):
        rr = max(5, m // 5)
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=(190, 198, 210, 255), outline=(255, 255, 255, 230), width=2)
        d.ellipse((cx - rr // 3, cy - rr // 3, cx + rr // 3, cy + rr // 3), fill=(120, 128, 140, 255))
    # ฐานตั้ง
    d.rounded_rectangle((-0, H2 - base, W2 - 1, H2 - 1), radius=int(base * 0.25), fill=(170, 200, 235, 70), outline=(230, 242, 255, 200), width=3)
    d.line((8, H2 - base + 6, W2 - 9, H2 - base + 6), fill=(255, 255, 255, 170), width=2)
    # แสงพาดเฉียงบนอะคริลิก
    gl = Image.new("RGBA", im.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
    gd.polygon([(W2 * 0.10, 0), (W2 * 0.32, 0), (W2 * 0.02, H2 * 0.55), (-W2 * 0.2, H2 * 0.55)], fill=(255, 255, 255, 46))
    gd.polygon([(W2 * 0.40, 0), (W2 * 0.46, 0), (W2 * 0.16, H2 * 0.55), (W2 * 0.10, H2 * 0.55)], fill=(255, 255, 255, 30))
    gl = ImageChops.multiply(gl, Image.new("RGBA", im.size, (255, 255, 255, 255)))
    a = ImageChops.multiply(gl.split()[3], im.split()[3]); gl.putalpha(a)
    im.alpha_composite(gl)
    return im


def place(canvas, case, cx, bottom, h, yaw):
    """วางเคสแบบหมุนรอบแกนตั้ง (yaw: + = หันขอบขวาไปด้านหลัง) พร้อมเงาสะท้อนบนพื้น"""
    w = h * case.width / case.height
    k = math.sin(math.radians(abs(yaw))) * 0.22
    narrow = w * (0.55 + 0.45 * math.cos(math.radians(yaw * 1.6)))
    x0, x1 = cx - narrow / 2, cx + narrow / 2
    top = bottom - h
    if yaw > 0:
        dst = [(x0, top), (x1, top + h * k), (x1, bottom - h * k * 0.35), (x0, bottom)]
    elif yaw < 0:
        dst = [(x0, top + h * k), (x1, top), (x1, bottom), (x0, bottom - h * k * 0.35)]
    else:
        dst = [(x0, top), (x1, top), (x1, bottom), (x0, bottom)]
    obj = perspective(case, dst, (W, H))
    # เงาสะท้อนบนพื้น (กลับหัว + จางลง)
    flip = case.transpose(Image.FLIP_TOP_BOTTOM)
    rdst = [(dst[3][0], dst[3][1]), (dst[2][0], dst[2][1]), (dst[1][0], dst[2][1] + (dst[2][1] - dst[1][1])), (dst[0][0], dst[3][1] + (dst[3][1] - dst[0][1]))]
    refl = perspective(flip, rdst, (W, H))
    fade = Image.new("L", (W, H), 0); fd = ImageDraw.Draw(fade)
    for i in range(int(h * 0.55)):
        fd.line((0, bottom + i, W, bottom + i), fill=int(125 * (1 - i / (h * 0.55)) ** 1.5))
    refl.putalpha(ImageChops.multiply(refl.split()[3], fade))
    canvas.alpha_composite(refl.filter(ImageFilter.GaussianBlur(2.2)))
    # เงาตกพื้น
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(s).ellipse((x0 - 10, bottom - 16, x1 + 10, bottom + 22), fill=(0, 0, 0, 170))
    canvas.alpha_composite(s.filter(ImageFilter.GaussianBlur(14)))
    canvas.alpha_composite(obj)


def text_glow(canvas, xy, s, font, fill, glow, blur=16, anchor="mm", stroke=0, stroke_fill=None):
    g = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).text(xy, s, font=font, fill=glow, anchor=anchor, stroke_width=stroke, stroke_fill=glow)
    canvas.alpha_composite(g.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(canvas).text(xy, s, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=stroke_fill)


def spaced(d, xy, s, font, fill, track):
    total = sum(d.textlength(ch, font=font) for ch in s) + track * (len(s) - 1)
    x = xy[0] - total / 2
    for ch in s:
        d.text((x, xy[1]), ch, font=font, fill=fill, anchor="lm"); x += d.textlength(ch, font=font) + track



# ---------- พื้นหลังโชว์รูม ----------
FLOOR = 738
im = vgrad(W, H, [(0, (6, 9, 22)), (0.5, (12, 18, 44)), (FLOOR / H, (20, 30, 66)), (FLOOR / H + 0.002, (8, 12, 28)), (1, (3, 4, 10))])
im.alpha_composite(glow_layer((W, H), [("ellipse", (524, 80, 1524, 900), (120, 170, 255, 70)), ("ellipse", (-100, 250, 560, 900), (150, 190, 255, 40)), ("ellipse", (1488, 250, 2148, 900), (150, 190, 255, 40))], 140))
beam = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bdr = ImageDraw.Draw(beam)
for cx in (240, 1808):
    bdr.polygon([(cx - 60, 0), (cx + 60, 0), (cx + 300, FLOOR), (cx - 300, FLOOR)], fill=(170, 205, 255, 30))
im.alpha_composite(beam.filter(ImageFilter.GaussianBlur(40)))
rnd = random.Random(11); bk = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(bk)
for _ in range(70):
    x = rnd.randint(-20, W + 20); y = rnd.randint(40, FLOOR - 30); r = rnd.randint(6, 26)
    bd.ellipse((x - r, y - r, x + r, y + r), fill=(140, 185, 255, rnd.randint(30, 80)))
im.alpha_composite(bk.filter(ImageFilter.GaussianBlur(7)))
fl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fl)
fd.line((0, FLOOR, W, FLOOR), fill=(170, 205, 255, 120), width=2)
im.alpha_composite(fl)
im.alpha_composite(glow_layer((W, H), [("ellipse", (-40, FLOOR - 40, 560, FLOOR + 60), (140, 185, 255, 55)), ("ellipse", (1488, FLOOR - 40, 2088, FLOOR + 60), (140, 185, 255, 55))], 40))

# ---------- การ์ดในเคส ซ้าย 2 ขวา 2 (อยู่นอกพื้นที่ปลอดภัยมือถือ) ----------
cards = [Image.open(p).convert("RGBA") for p in CARDS]
slots = [(125, -20, 300), (300, -9, 335), (1748, 9, 335), (1923, 20, 300)][: len(cards)]
for i in sorted(range(len(cards)), key=lambda i: -abs(slots[i][1])):
    cx, yaw, hgt = slots[i]
    case = acrylic_case(cards[i], 340)
    dim = Image.new("RGBA", case.size, (6, 10, 30, int(30 + abs(yaw) * 2.2)))
    dim.putalpha(ImageChops.multiply(dim.split()[3], case.split()[3])); case.alpha_composite(dim)
    place(im, case, cx, FLOOR - 8 - abs(yaw) * 0.6, hgt, yaw)

# ---------- ข้อความกลาง (อยู่ในพื้นที่ปลอดภัย y 407-745) ----------
CX = W // 2
text_glow(im, (CX, 470), "CARDZ CENTER", F(PB, 84), (255, 255, 255), (120, 170, 255, 170), blur=18)
d = ImageDraw.Draw(im)
d.text((CX, 540), "เรื่องเล่าเบื้องหลังการ์ด  ·  โปเกมอน  ·  วันพีซ  ·  ยูกิโอ", font=F(KS, 29), fill=(170, 205, 255), anchor="mm")
words = ["ซื้อ", "ขาย", "สะสม", "แข่งเกมส์การ์ด"]
f = F(KB, 40); dot = "  •  "
total = sum(d.textlength(w_, font=f) for w_ in words) + d.textlength(dot, font=f) * (len(words) - 1)
x = CX - total / 2
for j, w_ in enumerate(words):
    d.text((x, 595), w_, font=f, fill=(255, 255, 255), anchor="lm"); x += d.textlength(w_, font=f)
    if j < len(words) - 1:
        d.text((x, 595), dot, font=f, fill=GOLD, anchor="lm"); x += d.textlength(dot, font=f)
URL = "www.cardzcenter.com"
fu = F(PB, 36); tw = d.textlength(URL, font=fu); x0 = CX - tw / 2 - 40; x1 = CX + tw / 2 + 40; y0, y1 = 635, 697
im.alpha_composite(glow_layer((W, H), [("rounded_rectangle", (x0, y0, x1, y1), GOLD + (140,))], 20))
pill = vgrad(int(x1 - x0), y1 - y0, [(0, (255, 222, 130)), (1, (240, 176, 50))])
pm = Image.new("L", pill.size, 0); ImageDraw.Draw(pm).rounded_rectangle((0, 0, pill.width - 1, pill.height - 1), radius=(y1 - y0) // 2, fill=255)
im.paste(pill, (int(x0), y0), pm)
d = ImageDraw.Draw(im)
d.rounded_rectangle((x0, y0, x1, y1), radius=(y1 - y0) // 2, outline=(255, 245, 210), width=3)
d.text((CX, (y0 + y1) // 2), URL, font=fu, fill=(22, 18, 40), anchor="mm")

im = im.convert("RGB")
im.save(OUT, optimize=True)
im.save(OUT.rsplit(".", 1)[0] + ".jpg", quality=92, optimize=True)
# ปกกลุ่ม Facebook (1640x856): ครอปแนวตั้งให้ข้อความอยู่กลาง แล้วย่อให้ชัด (เซฟที่ <โฟลเดอร์เดียวกัน>/fb-group-cover.png)
import os
gc = im.crop((0, 41, 2048, 1110)).resize((1640, 856), Image.LANCZOS)
gc.save(os.path.join(os.path.dirname(OUT), "fb-group-cover.png"), optimize=True)
