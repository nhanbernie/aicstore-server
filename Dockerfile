FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

FROM base AS dev
COPY . .
RUN npm run build
CMD ["npm", "run", "start:dev"]

FROM base AS prod
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]