FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache postgresql-client
RUN npm install

COPY . .

EXPOSE 4001

CMD ["npm", "start"]
