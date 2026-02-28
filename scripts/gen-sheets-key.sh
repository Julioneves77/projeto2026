#!/bin/bash
# Gera chave de 32 bytes em base64 para SHEETS_CREDENTIALS_ENCRYPTION_KEY
# Uso: ./scripts/gen-sheets-key.sh [--append]

set -e

KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

echo "SHEETS_CREDENTIALS_ENCRYPTION_KEY=$KEY"
echo ""
echo "Adicione ao .env do servidor (nunca commite o .env):"
echo "  SHEETS_CREDENTIALS_ENCRYPTION_KEY=$KEY"
echo ""

if [ "$1" = "--append" ] && [ -f ".env" ]; then
  read -p "Adicionar ao .env local? (s/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "" >> .env
    echo "# GCLID/Sheets - Criptografia do JSON da Service Account" >> .env
    echo "SHEETS_CREDENTIALS_ENCRYPTION_KEY=$KEY" >> .env
    echo "✅ Adicionado ao .env"
  fi
fi
