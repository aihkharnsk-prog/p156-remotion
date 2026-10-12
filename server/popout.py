# ตัดพื้นหลังภาพในกรอบรูปของการ์ด ให้เหลือตัวละคร (ใช้ทำเอฟเฟกต์ตัวละครโผล่ออกจากการ์ด)
# ใช้: python3 popout.py in.png out.png x0 y0 x1 y1   (สัดส่วน 0..1 ของกรอบรูปบนการ์ด)
import sys
from PIL import Image
from rembg import remove, new_session

src, dst = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = map(float, sys.argv[3:7])
im = Image.open(src).convert("RGBA")
w, h = im.size
crop = im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))
out = remove(crop, session=new_session("isnet-general-use"))
a = out.split()[3]
cover = sum(1 for p in a.getdata() if p > 128) / (a.width * a.height)
out.save(dst)
print(f"{cover:.3f}")
