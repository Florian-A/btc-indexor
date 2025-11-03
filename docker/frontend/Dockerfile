FROM node:22

WORKDIR /app

COPY ./srcs/frontend /app/

RUN npm install -g vite

RUN npm install --omit=none

EXPOSE 5173

CMD ["npm", "run", "dev"]
