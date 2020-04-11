FROM node:10

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Pass the application start command
CMD [ "npm", "start" ]
