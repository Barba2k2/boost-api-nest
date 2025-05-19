#!/bin/bash
set -e

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$DATABASE_URL" ]; then
  echo "Erro: Variável DATABASE_URL não está definida"
  exit 1
fi

echo "Aguardando disponibilidade do banco de dados..."
# A função wait-for-it é implementada diretamente para evitar dependências adicionais
for i in {1..30}; do
  if npx prisma db push --skip-generate; then
    echo "Banco de dados disponível!"
    break
  fi
  echo "Aguardando banco de dados... ($i/30)"
  sleep 2
  if [ $i -eq 30 ]; then
    echo "Timeout ao esperar pelo banco de dados"
    exit 1
  fi
done

# Executar migrations
echo "Executando migrations..."
npx prisma migrate deploy

# Verificar se o banco de dados foi inicializado corretamente
echo "Verificando inicialização do banco de dados..."
npx prisma db pull

echo "Banco de dados inicializado com sucesso!"

# Iniciar aplicação
echo "Iniciando aplicação..."
node dist/main.js