# Utilise l'image Node officielle
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .

CMD ["node", "start.js"]