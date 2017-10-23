FROM node:7-slim

# install xvfb, "x virtual frame buffer"
RUN apt-get update && apt-get install -y \
  libgtk2.0-0 libgconf-2-4 libasound2 \
  libxtst6 libxss1 libnss3 xvfb \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# cache npm install
COPY package.json /app
RUN npm install

# copy project
ADD . /app

# expose micro
EXPOSE 3000

CMD ["npm", "start"]