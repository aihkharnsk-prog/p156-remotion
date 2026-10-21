FROM node:22-bookworm-slim

# Chrome dependencies + fonts (ไทย + ญี่ปุ่น สำหรับซับไตเติล)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
    libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 ca-certificates curl \
    fonts-noto-core fonts-noto-cjk fonts-thai-tlwg \
    python3 python3-pil python3-numpy ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
# ฟอนต์ไทยกลมเป็นมิตร Mitr (OFL) สำหรับคลิปแบบ friendly; ดาวน์โหลดไม่ได้ก็ข้าม (ใช้ฟอนต์สำรอง)
RUN for w in Regular Medium SemiBold Bold; do curl -fsSL --retry 3 -o public/fonts/Mitr-$w.ttf https://github.com/google/fonts/raw/main/ofl/mitr/Mitr-$w.ttf || rm -f public/fonts/Mitr-$w.ttf; done; ls -la public/fonts | grep -i mitr || true
RUN npx remotion browser ensure

ENV NODE_ENV=production
CMD ["node", "server/index.mjs"]
