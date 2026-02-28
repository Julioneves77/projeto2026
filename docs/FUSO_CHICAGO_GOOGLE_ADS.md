# Padronização Conversion Time - Google Ads Offline Conversions

## Formato obrigatório (Google Ads CSV)

```
YYYY-MM-DD HH:MM:SS
```

Exemplo: `2026-02-25 12:05:00`

**Regras críticas:**
- NÃO usar timezone (-06:00, Z, T)
- NÃO usar formato ISO
- Sempre STRING formatada
- Horário já convertido para Chicago (UTC-6)

## Configuração

- **Origem:** Brasil (UTC-03:00)
- **Conta Google Ads:** Chicago (UTC-06:00)
- **Conversão:** subtrair 3 horas

## Implementação automática (backend)

O sync-server converte e formata automaticamente:

- `utils/formatGoogleAdsDate.js`: `convertToChicagoTime()` retorna `yyyy-mm-dd hh:mm:ss`
- `services/sheetsExportService.js`: valida e exporta sem timezone

## Fórmula manual no Google Sheets

Coluna original em A2 (Brasil). Nova coluna `conversion_time_final`:

```
=TEXT(A2 - TIME(3,0,0), "yyyy-mm-dd hh:mm:ss")
```

Retorna STRING válida, sem timezone.

## Validação automática

- Formato exato: `yyyy-mm-dd hh:mm:ss`
- Sem timezone (-06:00, Z, T)
- Sem "<<Data/hora ausente>>"
- Sem datas futuras

## Regra final

**NUNCA enviar Conversion Time com timezone ou sem conversão correta.**
