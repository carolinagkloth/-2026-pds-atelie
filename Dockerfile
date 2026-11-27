FROM node:22-bookworm-slim

# Instala o Chromium e dependências necessárias para o WhatsApp Web (Puppeteer)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Informa ao Puppeteer onde está o Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Instala dependências do projeto
COPY package*.json ./
RUN npm install

# Copia o restante do código e gera o build do front-end (Vite/React)
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]