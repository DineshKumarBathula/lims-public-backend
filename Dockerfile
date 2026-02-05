FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Expose the port the app will run on
EXPOSE 8081

# Start the Nginx server
CMD npm start
