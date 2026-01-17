#!/bin/bash
cd "$(dirname "$0")"
npx pm2 start ecosystem.config.js
npx pm2 save
echo "✅ Servidor iniciado em produção"
npx pm2 status
