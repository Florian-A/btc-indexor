FROM node:22

WORKDIR /app

COPY . /app/

RUN rm -rf package-lock.json node_modules && npm install

RUN npm install

CMD ["node", "index.js"]