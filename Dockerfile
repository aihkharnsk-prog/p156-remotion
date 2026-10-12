FROM node:22-bookworm-slim

# Chrome dependencies + fonts (ไทย + ญี่ปุ่น สำหรับซับไตเติล)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
    libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 ca-certificates \
    fonts-noto-core fonts-noto-cjk fonts-thai-tlwg \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# ตัดพื้นหลังตัวละครสำหรับภาพปิดท้าย (rembg, MIT) + โหลดโมเดลไว้ตั้งแต่ build
RUN pip3 install --no-cache-dir --break-system-packages "rembg[cpu]" pillow \
    && python3 -c "from rembg import new_session; new_session('isnet-general-use')"

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
RUN npx remotion browser ensure

ENV NODE_ENV=production
CMD ["node", "server/index.mjs"]
