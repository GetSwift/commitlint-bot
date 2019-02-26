FROM node:10

WORKDIR /app
COPY ./package.json ./
RUN npm install --production
COPY . .

CMD npm start
