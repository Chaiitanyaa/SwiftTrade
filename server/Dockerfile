FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

RUN mkdir src

COPY src/ src/
# COPY test_data/ test_data/

EXPOSE 5000

CMD [ "npm", "start"]
