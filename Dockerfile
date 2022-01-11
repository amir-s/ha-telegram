FROM arm32v7/node
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
ENTRYPOINT [ "node", "index.js" ]