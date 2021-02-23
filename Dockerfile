FROM node:lts-alpine

# create root application folder
WORKDIR /bot

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
# copy source code to /app/src folder
COPY src /bot/src

# check files list
RUN ls -a

RUN npm install
RUN npm run build

CMD [ "npm", "start" ]