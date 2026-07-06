FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

# Migrations run on container start; dev server with hot reload
CMD ["sh", "-c", "pnpm db:migrate && pnpm exec next dev --turbo --hostname 0.0.0.0 --port 3000"]
