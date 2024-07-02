FROM node:18-alpine

WORKDIR /backend

COPY package*.json ./

RUN npm install --force

# Bundle app source code

COPY . .

COPY docker.env .env
