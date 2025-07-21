FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install --prod

COPY dist ./dist

EXPOSE 9999

CMD [ "node", "dist/index.js" ]