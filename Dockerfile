FROM node:24-alpine AS build

ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV CONTAINERIZED=1
ENV CONTAINER_FILE_PATH=/mnt/host-downloads

WORKDIR /app

RUN corepack enable
RUN npm config set registry ${NPM_REGISTRY}

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile

COPY src ./src

RUN pnpm build && pnpm prune --prod

FROM node:24-alpine

ENV CONTAINERIZED=1
ENV CONTAINER_FILE_PATH=/mnt/host-downloads

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENTRYPOINT ["node", "/app/dist/cli.js"]

CMD ["--help"]
