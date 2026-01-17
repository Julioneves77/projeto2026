# Configurar DNS para Portal Acesso

## ⚠️ Problema Identificado

O certificado SSL não pôde ser configurado porque o DNS do domínio `portalcacesso.online` não está apontando para o servidor.

**Erro:** `DNS problem: NXDOMAIN looking up A for portalcacesso.online`

## ✅ Solução: Configurar DNS

### 1. Acessar o Painel do Registrador de Domínio

Acesse o painel onde você registrou o domínio `portalcacesso.online` (ex: Registro.br, GoDaddy, Namecheap, etc.)

### 2. Configurar Registros DNS

Adicione os seguintes registros DNS:

#### Registro A (IPv4)
```
Tipo: A
Nome: @ (ou portalcacesso.online)
Valor: 143.198.10.145
TTL: 3600 (ou padrão)
```

#### Registro A para www
```
Tipo: A
Nome: www
Valor: 143.198.10.145
TTL: 3600 (ou padrão)
```

### 3. Verificar Propagação DNS

Após configurar, aguarde alguns minutos e verifique:

```bash
# Verificar DNS
dig portalcacesso.online +short
dig www.portalcacesso.online +short

# Deve retornar: 143.198.10.145
```

**Ferramentas online:**
- https://www.whatsmydns.net/#A/portalcacesso.online
- https://dnschecker.org/#A/portalcacesso.online

### 4. Após DNS Propagado, Configurar SSL

Quando o DNS estiver apontando corretamente, execute:

```bash
bash configurar-https-agora.sh root
```

**OU** no servidor:

```bash
sudo certbot --nginx \
    -d www.portalcacesso.online \
    -d portalcacesso.online \
    -d portalacesso.online \
    --non-interactive \
    --agree-tos \
    --email contato@portalcertidao.org \
    --redirect
```

## 🔍 Verificações

### Verificar DNS Localmente

```bash
# Verificar registro A
dig portalcacesso.online +short

# Verificar registro AAAA (IPv6) - opcional
dig portalcacesso.online AAAA +short

# Verificar www
dig www.portalcacesso.online +short
```

### Verificar se o Servidor Está Acessível

```bash
# Testar HTTP
curl -I http://143.198.10.145

# Testar se o nginx está respondendo
curl -I -H "Host: portalcacesso.online" http://143.198.10.145
```

## 📋 Checklist

- [ ] DNS configurado no registrador
- [ ] Registro A apontando para 143.198.10.145
- [ ] Registro A para www apontando para 143.198.10.145
- [ ] DNS propagado (verificado com dig)
- [ ] Nginx configurado no servidor
- [ ] Porta 80 acessível
- [ ] SSL configurado com sucesso

## ⏱️ Tempo de Propagação

- **Normal:** 5-30 minutos
- **Máximo:** Até 48 horas (raro)
- **Recomendado:** Aguardar 1-2 horas antes de tentar SSL novamente

## 🔄 Após DNS Propagado

Execute novamente:

```bash
bash configurar-https-agora.sh root
```

Ou no servidor:

```bash
sudo bash scripts/configure-ssl-portal-acesso.sh
```

## 📞 Suporte

Se o DNS já está configurado mas ainda não funciona:
1. Verifique se o TTL está muito alto
2. Limpe o cache DNS local: `sudo systemd-resolve --flush-caches`
3. Aguarde mais tempo para propagação
4. Verifique se não há firewall bloqueando

