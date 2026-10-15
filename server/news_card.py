# ภาพข่าวการ์ดสำหรับเพจ Facebook (1080x1350, 4:5)
# ใช้: python3 news_card.py out.png fonts_dir spec.json
# spec = {"game": "ONE PIECE CARD GAME", "accent": "#e8423f", "headline": "บรรทัด1\nบรรทัด *เน้น*",
#         "bullets": ["...", "..."], "date": "16 ต.ค. 2026", "image": "/path/optional.png", "source": "ที่มา: ..."}
import sys, json, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT, FD, SPEC = sys.argv[1], sys.argv[2].rstrip("/") + "/", sys.argv[3]
S = json.load(open(SPEC, encoding="utf-8"))
W, H = 1080, 1350
GOLD = (255, 204, 92)
F = lambda n, s: ImageFont.truetype(FD + n, s)


def hexrgb(h, d=GOLD):
    try:
        h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    except Exception:
        return d


ACC = hexrgb(S.get("accent", "#ffcc5c"))

# ---------- พื้นหลัง ----------
y = np.linspace(0, 1, H)[:, None, None]
bg = (np.array([12, 14, 30]) * (1 - y) + np.array([4, 4, 10]) * y).repeat(W, axis=1)
im = Image.fromarray(bg.astype(np.uint8), "RGB").convert("RGBA")
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
gd.ellipse((-300, -350, 900, 650), fill=ACC + (95,))
gd.ellipse((450, 850, 1500, 1800), fill=GOLD + (45,))
im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(160)))
rnd = random.Random(7); dots = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(dots)
for _ in range(90):
    x, yy, r = rnd.randint(0, W), rnd.randint(0, H), rnd.choice([1, 1, 2, 3])
    dd.ellipse((x - r, yy - r, x + r, yy + r), fill=(255, 230, 170, rnd.randint(40, 140)))
im.alpha_composite(dots)
# กรอบทอง
fr = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(fr).rounded_rectangle((28, 28, W - 28, H - 28), radius=36, outline=GOLD + (150,), width=3)
im.alpha_composite(fr)

d = ImageDraw.Draw(im)
M = 76
# ---------- หัว ----------
d.text((M, 104), "CARDZ CENTER", font=F("Poppins-Bold.ttf", 44), fill=(255, 255, 255), anchor="lm")
tag = S.get("tag", "ข่าวการ์ด")
tf = F("Kanit-Bold.ttf", 38)
tw = d.textlength(tag, font=tf); x1 = W - M; x0 = x1 - tw - 56
d.rounded_rectangle((x0, 74, x1, 134), radius=30, fill=ACC)
d.text(((x0 + x1) / 2, 104), tag, font=tf, fill=(255, 255, 255), anchor="mm")
d.line((M, 164, W - M, 164), fill=GOLD + (170,), width=3)


def wrap(text, font, maxw):
    lines = []
    for para in str(text).split("\n"):
        cur = ""
        for word in para.split(" "):
            t = (cur + " " + word).strip()
            if d.textlength(t.replace("*", ""), font=font) <= maxw or not cur:
                cur = t
            else:
                lines.append(cur); cur = word
        lines.append(cur)
    return lines


# ---------- เนื้อหา: วัดความสูงก่อน แล้ววางกึ่งกลางพื้นที่ ----------
TOP, BOT = 196, H - 172
src = None
if S.get("image"):
    try:
        src = Image.open(S["image"]).convert("RGBA")
    except Exception as e:
        print("image skipped:", e); src = None

head = S.get("headline", "")
bullets = S.get("bullets", [])[:5]
game = S.get("game", "")
PIC_MAX, PIC_MIN = 700, 560  # รูปการ์ดจริงต้องเด่น — ตัวหนังสือย่อก่อน แล้วค่อยหดรูป
for hs, bs in ((112, 46), (100, 44), (92, 42), (84, 40), (76, 38), (68, 36), (60, 34), (54, 32)):
    hf, bf = F("Kanit-ExtraBold.ttf", hs), F("Kanit-Medium.ttf", bs)
    hl = wrap(head, hf, W - 2 * M)
    bls = [wrap(b, bf, W - 2 * M - 48) for b in bullets]
    th = (64 if game else 0) + len(hl) * int(hs * 1.2) + 36 + sum(len(x) * int(bs * 1.38) + 18 for x in bls) - 18
    room = BOT - TOP - th - (40 if src else 0)
    if room >= (PIC_MIN if src else 0):
        break
pic = None
if src is not None:
    bh = max(160, min(PIC_MAX, room))
    r = min((W - 2 * M) / src.width, bh / src.height)
    pic = src.resize((int(src.width * r), int(src.height * r)), Image.LANCZOS)
h = th + (pic.height + 40 if pic else 0)
yy = TOP + max(0, (BOT - TOP - h) // 2)

if game:
    d.text((M, yy + 20), game, font=F("Poppins-Bold.ttf", 34), fill=ACC, anchor="lm"); yy += 64
if pic:
    px = (W - pic.width) // 2
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((px + 10, yy + 16, px + pic.width + 10, yy + pic.height + 16), radius=24, fill=(0, 0, 0, 170))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    m = Image.new("L", pic.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pic.width - 1, pic.height - 1), radius=24, fill=255)
    im.paste(pic, (px, yy), m); d = ImageDraw.Draw(im)
    yy += pic.height + 40

hi = False  # สถานะสีเน้นต่อเนื่องข้ามบรรทัด
for line in hl:
    x = M
    for k, part in enumerate(line.split("*")):
        if k > 0:
            hi = not hi
        col = ACC if hi else (255, 255, 255)
        d.text((x + 3, yy + 4), part, font=hf, fill=(0, 0, 0))
        d.text((x, yy), part, font=hf, fill=col)
        x += d.textlength(part, font=hf)
    yy += int(hs * 1.2)
yy += 36
lh = int(bs * 1.38)
for bl in bls:
    d.ellipse((M + 2, yy + lh // 2 - 9, M + 20, yy + lh // 2 + 9), fill=ACC)
    for line in bl:
        d.text((M + 48, yy), line, font=bf, fill=(234, 234, 242)); yy += lh
    yy += 18

# ---------- ท้าย ----------
d.line((M, H - 150, W - M, H - 150), fill=GOLD + (130,), width=2)
if S.get("date"):
    d.text((M, H - 118), S["date"], font=F("Kanit-SemiBold.ttf", 30), fill=(200, 200, 212), anchor="lm")
if S.get("source"):
    d.text((M, H - 78), S["source"], font=F("Kanit-Medium.ttf", 26), fill=(160, 160, 178), anchor="lm")
d.text((W - M, H - 98), "www.cardzcenter.com", font=F("Poppins-Bold.ttf", 36), fill=GOLD, anchor="rm")
im.convert("RGB").save(OUT, quality=92)
