# prepare (only invalidate cache on dependency change)
FROM alpine:3.15 AS prep
RUN apk update && apk add --no-cache jq
COPY package.json /tmp
RUN jq '{ dependencies, devDependencies, scripts }' < /tmp/package.json > /tmp/prepared.json

# build
FROM node:16.13.2-alpine3.15 AS builder
WORKDIR /app
RUN apk update && apk add --no-cache python3 py3-pip make zlib-dev g++
COPY tsconfig.json ./
COPY --from=prep /tmp/prepared.json ./package.json
COPY package-lock.json ./
RUN npm ci
COPY src ./src
RUN npm run build && npm prune --production

# start
FROM node:16.13.2-alpine3.15 AS runner
WORKDIR /app
RUN apk update && apk add --no-cache bash
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node
CMD ["node", "dist/main"]