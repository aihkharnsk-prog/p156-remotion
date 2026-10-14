# ภาพปกเพจ Facebook แบบอื่นๆ (1640x624)
# ใช้: python3 fb_cover_alt.py out.png fonts_dir style card1 [card2 ...]
#   style = "fan"  : พื้นดำ-ทอง หรูแบบโลโก้ การ์ดกางเป็นพัดด้านขวา ข้อความชิดซ้าย
#   style = "wall" : กำแพงการ์ดเอียงเต็มพื้นหลัง + แผ่นกระจกดำตรงกลาง
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT, FD, STYLE = sys.argv[1], sys.argv[2].rstrip("/") + "/", sys.argv[3]
CARDS = sys.argv[4:]
W, H = 1640, 624
GOLD = (255, 204, 92)
KS = FD + "Kanit-SemiBold.ttf"; KB = FD + "Kanit-Bold.ttf"; KX = FD + "Kanit-ExtraBold.ttf"
PB = FD + "Poppins-Bold.ttf"; PM = FD + "Poppins-Medium.ttf"
F = lambda p, s: ImageFont.truetype(p, s)


def vgrad(w, h, stops, horizontal=False):
    n = w if horizontal else h
    arr = np.zeros((n, 3), np.float32)
    ts = np.linspace(0, 1, n)
    for i in range(len(stops) - 1):
        (t0, c0), (t1, c1) = stops[i], stops[i + 1]
        m = (ts >= t0) & (ts <= t1)
        t = ((ts[m] - t0) / max(t1 - t0, 1e-6))[:, None]
        arr[m] = np.array(c0) * (1 - t) + np.array(c1) * t
    img = np.repeat(arr[None, :, :], h, 0) if horizontal else np.repeat(arr[:, None, :], w, 1)
    return Image.fromarray(img.clip(0, 255).astype(np.uint8), "RGB").convert("RGBA")


def glow(size, shapes, blur):
    g = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    for kind, box, col in shapes:
        getattr(d, kind)(box, fill=col)
    return g.filter(ImageFilter.GaussianBlur(blur))


def card_img(path, cw, radius=0.045, border=None):
    c = Image.open(path).convert("RGBA")
    ch = int(cw * 1.395)
    c = c.resize((cw, ch), Image.LANCZOS)
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=int(cw * radius), fill=255)
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0)); out.paste(c, (0, 0), m)
    if border:
        ImageDraw.Draw(out).rounded_rectangle((1, 1, cw - 2, ch - 2), radius=int(cw * radius), outline=border, width=max(2, cw // 90))
    return out


def paste_rot(canvas, img, cx, cy, angle, shadow=True):
    r = img.rotate(angle, resample=Image.BICUBIC, expand=True)
    x, y = int(cx - r.width / 2), int(cy - r.height / 2)
    if shadow:
        s = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sm = r.split()[3].point(lambda a: int(a * 0.75))
        s.paste((0, 0, 0, 255), (x + 14, y + 22), sm)
        canvas.alpha_composite(s.filter(ImageFilter.GaussianBlur(16)))
    canvas.alpha_composite(r, (x, y))


def text_glow(canvas, xy, s, font, fill, glowc, blur=16, anchor="mm"):
    g = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).text(xy, s, font=font, fill=glowc, anchor=anchor)
    canvas.alpha_composite(g.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(canvas).text(xy, s, font=font, fill=fill, anchor=anchor)


def pill(canvas, cx, y0, y1, text, font, left=None):
    d = ImageDraw.Draw(canvas)
    tw = d.textlength(text, font=font)
    x0 = (left if left is not None else cx - tw / 2 - 40); x1 = x0 + tw + 80
    canvas.alpha_composite(glow(canvas.size, [("rounded_rectangle", (x0, y0, x1, y1), GOLD + (130,))], 18))
    p = vgrad(int(x1 - x0), y1 - y0, [(0, (255, 222, 130)), (1, (240, 176, 50))])
    pm = Image.new("L", p.size, 0); ImageDraw.Draw(pm).rounded_rectangle((0, 0, p.width - 1, p.height - 1), radius=(y1 - y0) // 2, fill=255)
    canvas.paste(p, (int(x0), y0), pm)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x0, y0, x1, y1), radius=(y1 - y0) // 2, outline=(255, 245, 210), width=3)
    d.text(((x0 + x1) / 2, (y0 + y1) / 2), text, font=font, fill=(22, 18, 40), anchor="mm")


def words_line(d, xy, words, font, anchor_left=False):
    dot = "  •  "
    total = sum(d.textlength(w_, font=font) for w_ in words) + d.textlength(dot, font=font) * (len(words) - 1)
    x = xy[0] if anchor_left else xy[0] - total / 2
    for j, w_ in enumerate(words):
        d.text((x, xy[1]), w_, font=font, fill=(255, 255, 255), anchor="lm"); x += d.textlength(w_, font=font)
        if j < len(words) - 1:
            d.text((x, xy[1]), dot, font=font, fill=GOLD, anchor="lm"); x += d.textlength(dot, font=font)


WORDS = ["ซื้อ", "ขาย", "สะสม", "แข่งเกมส์การ์ด"]

if STYLE == "fan":
    # ---------- ดำ-ทอง: การ์ดกางเป็นพัดด้านขวา ----------
    im = vgrad(W, H, [(0, (4, 4, 6)), (0.55, (14, 12, 10)), (1, (30, 24, 14))], horizontal=True)
    im.alpha_composite(glow((W, H), [("ellipse", (900, -200, 1600, 760), (255, 190, 80, 60))], 120))
    ln = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(ln)
    for k in range(9):
        x = 640 + k * 120
        ld.line((x, H, x + 360, 0), fill=GOLD + (22 if k % 2 else 38,), width=2)
    im.alpha_composite(ln)
    rnd = random.Random(3); sp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sp)
    for _ in range(70):
        x, y, r = rnd.randint(700, W), rnd.randint(0, H), rnd.choice([1, 2, 2, 3])
        sd.ellipse((x - r, y - r, x + r, y + r), fill=(255, 220, 140, rnd.randint(60, 200)))
    im.alpha_composite(sp.filter(ImageFilter.GaussianBlur(0.6)))
    n = min(5, len(CARDS))
    pivot = (1335, 740)
    angles = [-28, -14, 0, 14, 28][:n] if n == 5 else [(-12 * (n - 1) / 2) + 12 * i for i in range(n)]
    order = [0, 4, 1, 3, 2][:n] if n == 5 else list(range(n))
    for i in order:
        a = angles[i]
        c = card_img(CARDS[i], 205, border=GOLD + (230,))
        rad = math.radians(a); L = 400
        cx = pivot[0] + math.sin(rad) * L; cy = pivot[1] - math.cos(rad) * L
        paste_rot(im, c, cx, cy, -a)
    # ข้อความชิดซ้าย (อยู่ในเขตที่มือถือยังเห็น x>=300)
    LX = 330
    d = ImageDraw.Draw(im)
    d.line((LX, 96, LX + 70, 96), fill=GOLD, width=3)
    d.text((LX + 86, 96), "THE TRADING CARD HUB", font=F(PM, 24), fill=GOLD, anchor="lm")
    text_glow(im, (LX - 4, 168), "CARDZ CENTER", F(PB, 86), (255, 255, 255), GOLD + (90,), blur=14, anchor="lm")
    d = ImageDraw.Draw(im)
    d.text((LX, 240), "เรื่องเล่าเบื้องหลังการ์ด โปเกมอน • วันพีซ • ยูกิโอ", font=F(KS, 30), fill=(230, 215, 180), anchor="lm")
    words_line(d, (LX, 300), WORDS, F(KB, 40), anchor_left=True)
    pill(im, 0, 340, 400, "www.cardzcenter.com", F(PB, 34), left=LX)

elif STYLE == "wall":
    # ---------- กำแพงการ์ดเอียงเต็มพื้นหลัง + แผ่นกระจกดำตรงกลาง ----------
    im = Image.new("RGBA", (W, H), (8, 10, 20, 255))
    big = Image.new("RGBA", (2600, 2000), (8, 10, 20, 255))
    cw, gap = 200, 22; ch = int(cw * 1.395)
    imgs = [card_img(p, cw) for p in CARDS] or [Image.new("RGBA", (cw, ch), (60, 60, 80, 255))]
    k = 0
    for row in range(0, 2000 // (ch + gap) + 1):
        off = (row % 2) * (cw + gap) // 2
        for col in range(-1, 2600 // (cw + gap) + 1):
            big.alpha_composite(imgs[k % len(imgs)], (col * (cw + gap) + off, row * (ch + gap))); k += 3
    big = big.rotate(-16, resample=Image.BICUBIC)
    im.alpha_composite(big.crop((480, 680, 480 + W, 680 + H)))
    im.alpha_composite(Image.new("RGBA", (W, H), (6, 8, 22, 120)))
    # ไล่มืดเข้าหาตรงกลาง ให้ข้อความเด่น
    v = vgrad(W, H, [(0, (0, 0, 0)), (0.5, (0, 0, 0)), (1, (0, 0, 0))], horizontal=True)
    a = np.zeros((H, W), np.float32); xs = np.abs(np.linspace(-1, 1, W))[None, :]
    a[:] = (1 - np.clip((xs - 0.05) / 0.55, 0, 1)) * 175
    v.putalpha(Image.fromarray(a.astype(np.uint8), "L")); im.alpha_composite(v)
    # แผ่นกระจกกลาง
    px0, py0, px1, py1 = 470, 162, 1170, 462
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0)); pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((px0, py0, px1, py1), radius=30, fill=(6, 8, 18, 205), outline=GOLD + (200,), width=3)
    im.alpha_composite(glow((W, H), [("rounded_rectangle", (px0, py0, px1, py1), GOLD + (70,))], 26))
    im.alpha_composite(panel)
    text_glow(im, (W // 2, 228), "CARDZ CENTER", F(PB, 76), (255, 255, 255), (120, 170, 255, 160), blur=16)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 290), "เรื่องเล่าเบื้องหลังการ์ด · โปเกมอน · วันพีซ · ยูกิโอ", font=F(KS, 27), fill=(170, 205, 255), anchor="mm")
    words_line(d, (W // 2, 340), WORDS, F(KB, 38))
    pill(im, W // 2, 378, 436, "www.cardzcenter.com", F(PB, 33))

im.convert("RGB").save(OUT, quality=95)
