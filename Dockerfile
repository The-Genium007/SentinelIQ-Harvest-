# Utilise l'image Node officielle
FROM node:18-alpine

WORKDIR /app

COPY WireScout/package.json WireScout/package-lock.json ./
RUN npm install --frozen-lockfile

COPY WireScout .

CMD ["node", "start.js"]