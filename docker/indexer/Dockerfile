FROM node:22

WORKDIR /app

RUN if [ -f package.json ]; then npm install; fi

CMD ["node", "index.js"]