FROM node:10


COPY ./package.json ./
RUN npm install --production
COPY . .

# ENTRYPOINT ["/app/node_modules/.bin/probot", "receive"]
# CMD ["/app/index.js"]
CMD npm start