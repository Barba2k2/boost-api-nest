FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Construir a aplicação
RUN npm run build

# Remover dependências de desenvolvimento
RUN npm prune --production

# Imagem final
FROM node:20-alpine

WORKDIR /app

# Instalar pacotes necessários
RUN apk add --no-cache \
  postgresql-client \
  bash \
  cronie

# Copiar a aplicação compilada
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar arquivos de configuração e scripts
COPY package.json ./
COPY scripts ./scripts
COPY entrypoint.sh ./entrypoint.sh

# Criar diretórios necessários
RUN mkdir -p ./backups

# Configurar permissões
RUN chmod +x ./entrypoint.sh ./scripts/db_backup.sh ./scripts/db_restore.sh ./scripts/setup_backup_cron.sh

EXPOSE 3000

CMD ["/app/entrypoint.sh"]