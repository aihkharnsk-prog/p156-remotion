# ภาพปิดท้ายสปอนเซอร์ Cardz Center: การ์ดจริงในเคสอะคริลิก วางบนพื้นเงาแบบโชว์รูมของสะสม
# ใช้: python3 outro_compose.py out.png fonts_dir card1 [card2 ...]   (การ์ด 1-5 ใบ ใบกลางคือใบที่ (n+1)/2)
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT, FD = sys.argv[1], sys.argv[2].rstrip("/") + "/"
CARDS = sys.argv[3:8]
W, H = 1080, 1920
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
FLOOR = 1330
im = vgrad(W, H, [(0, (6, 9, 22)), (0.45, (12, 18, 44)), (FLOOR / H, (20, 30, 66)), (FLOOR / H + 0.001, (8, 12, 28)), (1, (3, 4, 10))])
im.alpha_composite(glow_layer((W, H), [("ellipse", (90, -420, 990, 980), (120, 170, 255, 70)), ("ellipse", (300, 560, 780, 1240), (150, 190, 255, 55))], 120))
# ลำแสงสปอตไลต์จากด้านบน
beam = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(beam).polygon([(470, 0), (610, 0), (900, FLOOR), (180, FLOOR)], fill=(170, 205, 255, 34))
im.alpha_composite(beam.filter(ImageFilter.GaussianBlur(40)))
# โบเก้นุ่มๆ ฉากหลัง
rnd = random.Random(7); bk = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(bk)
for _ in range(38):
    x = rnd.choice([rnd.randint(-40, 260), rnd.randint(820, 1120)]); y = rnd.randint(560, FLOOR - 40); r = rnd.randint(10, 34)
    bd.ellipse((x - r, y - r, x + r, y + r), fill=(140, 185, 255, rnd.randint(40, 95)))
im.alpha_composite(bk.filter(ImageFilter.GaussianBlur(7)))
# เส้นขอบฟ้า + ลายพื้นหินอ่อนจางๆ
fl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fl)
fd.line((0, FLOOR, W, FLOOR), fill=(170, 205, 255, 120), width=2)
for i in range(16):
    x = rnd.randint(-200, W); fd.line((x, FLOOR + 10, x + rnd.randint(-300, 300), H), fill=(150, 175, 220, 22), width=rnd.choice([1, 2]))
im.alpha_composite(fl.filter(ImageFilter.GaussianBlur(0.8)))
im.alpha_composite(glow_layer((W, H), [("ellipse", (160, FLOOR - 60, 920, FLOOR + 120), (140, 185, 255, 60))], 50))

# ---------- หัว ----------
d = ImageDraw.Draw(im)
spaced(d, (W // 2, 168), "PRESENTED BY", F(PM, 30), GOLD, 7)
d.line((W // 2 - 250, 168, W // 2 - 150, 168), fill=GOLD + (160,), width=2); d.line((W // 2 + 150, 168, W // 2 + 250, 168), fill=GOLD + (160,), width=2)
text_glow(im, (W // 2, 285), "CARDZ CENTER", F(PB, 124), (255, 255, 255), (120, 170, 255, 170), blur=22)
d = ImageDraw.Draw(im)
d.text((W // 2, 420), "ชอบเรื่องเล่าการ์ดแบบนี้", font=F(KS, 54), fill=(225, 232, 250), anchor="mm")
text_glow(im, (W // 2, 505), "กดติดตามไว้เลย", F(KX, 96), GOLD, GOLD + (110,), blur=18)

# ---------- การ์ดในเคส ----------
cards = [Image.open(p).convert("RGBA") for p in CARDS]
n = len(cards)
slots = {1: [(540, 0, 640)], 2: [(380, -14, 560), (700, 14, 560)], 3: [(250, -26, 470), (540, 0, 600), (830, 26, 470)],
         4: [(170, -30, 420), (400, -12, 500), (680, 12, 500), (910, 30, 420)],
         5: [(150, -24, 450), (330, -14, 520), (540, 0, 640), (750, 14, 520), (930, 24, 450)]}[n]
# วาดจากข้างนอกเข้ากลาง ให้ใบกลางอยู่หน้าสุด
order = sorted(range(n), key=lambda i: -abs(slots[i][1]))
for i in order:
    cx, yaw, hgt = slots[i]
    case = acrylic_case(cards[i], 420)
    if yaw:
        dim = Image.new("RGBA", case.size, (6, 10, 30, int(40 + abs(yaw) * 2.2)))
        dim.putalpha(ImageChops.multiply(dim.split()[3], case.split()[3])); case.alpha_composite(dim)
    place(im, case, cx, FLOOR - (0 if not yaw else 18 + abs(yaw) * 1.2), hgt, yaw)

# ---------- ข้อความล่าง ----------
d = ImageDraw.Draw(im)
words = ["ซื้อ", "ขาย", "สะสม", "แข่งเกมส์การ์ด"]
f = F(KB, 56); dot = "  •  "
total = sum(d.textlength(w_, font=f) for w_ in words) + d.textlength(dot, font=f) * (len(words) - 1)
x = W / 2 - total / 2
for j, w_ in enumerate(words):
    d.text((x, 1452), w_, font=f, fill=(255, 255, 255), anchor="lm"); x += d.textlength(w_, font=f)
    if j < len(words) - 1:
        d.text((x, 1452), dot, font=f, fill=GOLD, anchor="lm"); x += d.textlength(dot, font=f)
d.text((W // 2, 1522), "ครบจบในเว็บเดียว", font=F(KS, 46), fill=(160, 200, 255), anchor="mm")
fu = F(PB, 82); tw = d.textlength("cardzcenter.com", font=fu); x0 = W / 2 - tw / 2 - 58; x1 = W / 2 + tw / 2 + 58
im.alpha_composite(glow_layer((W, H), [("rounded_rectangle", (x0, 1578, x1, 1702), GOLD + (150,))], 28))
pill = vgrad(int(x1 - x0), 124, [(0, (255, 222, 130)), (1, (240, 176, 50))])
pm = Image.new("L", pill.size, 0); ImageDraw.Draw(pm).rounded_rectangle((0, 0, pill.width - 1, 123), radius=62, fill=255)
im.paste(pill, (int(x0), 1578), pm)
d = ImageDraw.Draw(im)
d.rounded_rectangle((x0, 1578, x1, 1702), radius=62, outline=(255, 245, 210), width=3)
d.text((W // 2, 1638), "cardzcenter.com", font=fu, fill=(22, 18, 40), anchor="mm")

im.convert("RGB").save(OUT)
