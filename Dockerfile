# Utilise l'image Node officielle
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copier tout le code — ou précision selon ta structure
COPY . .

# Lancer le bon script si le fichier start.js se trouve dans WireScanner
CMD ["node", "WireScanner/start.js"]