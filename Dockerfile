# Utilise l'image Node officielle
FROM node:18-alpine

WORKDIR /app

# Installe pnpm (facultatif) ou npm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN npm install --frozen-lockfile

COPY . .

CMD ["node", "start.js"]