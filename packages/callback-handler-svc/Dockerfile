FROM node:18.16.1-alpine as builder
USER root

WORKDIR /opt/app

RUN apk add --no-cache -t build-dependencies git make gcc g++ python3 libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm install --unsafe-perm=true -g node-gyp

COPY package.json package-lock.json* /opt/app/
RUN npm ci

# check in .dockerignore what is skipped during copy
COPY /. /opt/app/

RUN npm run build
RUN rm -rf src

# cleanup
RUN apk del build-dependencies

FROM node:18.16.1-alpine
WORKDIR /opt/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: app-user
RUN adduser -D app-user
USER app-user

COPY --chown=app-user --from=builder /opt/app .

EXPOSE 3001
CMD ["npm", "run", "start"]
