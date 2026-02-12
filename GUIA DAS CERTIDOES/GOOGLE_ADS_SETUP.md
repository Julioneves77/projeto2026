# Configuração para Google Ads - Guia das Certidões

## Informações do Site

- **URL Principal**: https://www.centraldascertidoes.com
- **Email de Contato**: contato@centraldascertidoes.com
- **CNPJ**: 62.083.937/0001-25
- **Razão Social**: Certidigital Brasil Tech LTDA
- **Nome Comercial**: Guia das Certidões Brasil

## Arquivos Criados para SEO e Google Ads

### 1. Sitemap XML
- **URL**: https://www.centraldascertidoes.com/sitemap.xml
- **Localização**: `/public/sitemap.xml`
- Contém todas as páginas principais do site

### 2. Robots.txt
- **URL**: https://www.centraldascertidoes.com/robots.txt
- **Localização**: `/public/robots.txt`
- Configurado para permitir indexação
- Referencia o sitemap.xml
- Bloqueia páginas sensíveis (pagamento, obrigado)

### 3. Meta Tags SEO
- **Localização**: `/index.html`
- Meta tags completas para SEO
- Open Graph para redes sociais
- Twitter Cards
- Canonical URL
- Google Tag Manager integrado (GTM-5M37FK67)

### 4. Security.txt
- **URL**: https://www.centraldascertidoes.com/.well-known/security.txt
- Informações de contato para segurança

### 5. Humans.txt
- **URL**: https://www.centraldascertidoes.com/humans.txt
- Informações sobre a empresa e tecnologia

## Páginas do Site

1. **Página Principal** (`/`)
   - Título: Guia das Certidões - Solicite suas certidões online
   - Descrição: Solicite certidões online de forma rápida e segura

2. **Solicitar Certidão** (`/solicitar`)
   - Formulário de solicitação

3. **Fale Conosco** (`/fale-conosco`)
   - Informações de contato

4. **Termos de Uso** (`/termos-de-uso`)
   - Termos e condições completos

5. **Política de Privacidade** (`/politica-de-privacidade`)
   - Política de privacidade conforme LGPD

## Configurações no Google Ads

### 1. Google Search Console
1. Acesse: https://search.google.com/search-console
2. Adicione a propriedade: `https://www.centraldascertidoes.com`
3. Verifique a propriedade (método recomendado: tag HTML no index.html)
4. Envie o sitemap: `https://www.centraldascertidoes.com/sitemap.xml`

### 2. Google Tag Manager
- **Container ID**: GTM-5M37FK67
- Já integrado no `index.html`
- Configure eventos de conversão:
  - Página `/obrigado` (conversão de pagamento)
  - Cliques em botões de ação
  - Preenchimento de formulário

### 3. Google Ads - Verificação do Site
1. Acesse: https://ads.google.com
2. Vá em: Ferramentas e configurações > Configurações da conta > Verificação do site
3. Adicione: `www.centraldascertidoes.com`
4. Siga as instruções de verificação

### 4. Políticas do Google Ads

#### Requisitos Atendidos:
- ✅ Política de Privacidade completa e acessível
- ✅ Termos de Uso completos e acessíveis
- ✅ Informações de contato claras
- ✅ Informações da empresa (CNPJ) no rodapé
- ✅ SSL/HTTPS (quando configurado)
- ✅ Conteúdo original e relevante
- ✅ Navegação clara e funcional

#### Páginas Importantes para Aprovação:
- **Política de Privacidade**: `/politica-de-privacidade`
- **Termos de Uso**: `/termos-de-uso`
- **Contato**: `/fale-conosco`
- **Rodapé**: Informações da empresa visíveis em todas as páginas

### 5. Estrutura de Conversão

#### Página de Conversão: `/obrigado`
- GTM já configurado para disparar evento de conversão
- Evento: `conversion` no dataLayer
- Parâmetros: `event_category: 'conversion'`, `event_label: 'pagamento_confirmado'`

#### Configuração no Google Ads:
1. Vá em: Ferramentas e configurações > Medição > Conversões
2. Crie nova ação de conversão
3. Tipo: Página da web
4. URL: `https://www.centraldascertidoes.com/obrigado`
5. Categoria: Compra/Venda
6. Valor: Usar valor da transação (se disponível)

## Checklist de Aprovação

### Conteúdo
- [x] Política de Privacidade completa e acessível
- [x] Termos de Uso completos e acessíveis
- [x] Informações de contato claras
- [x] Informações da empresa (CNPJ) visíveis
- [x] Conteúdo original e relevante
- [x] Navegação funcional

### Técnico
- [x] Sitemap.xml configurado
- [x] Robots.txt configurado
- [x] Meta tags SEO completas
- [x] Google Tag Manager integrado
- [x] Estrutura de conversão configurada
- [ ] SSL/HTTPS configurado (pendente - aguardando DNS)

### Google Ads
- [ ] Conta Google Ads criada
- [ ] Google Search Console verificado
- [ ] Sitemap enviado ao Search Console
- [ ] Site verificado no Google Ads
- [ ] Conversões configuradas
- [ ] Campanhas criadas

## Próximos Passos

1. **Configurar SSL**:
   ```bash
   sudo certbot --nginx -d www.centraldascertidoes.com -d centraldascertidoes.com
   ```

2. **Verificar no Google Search Console**:
   - Adicionar propriedade
   - Verificar propriedade
   - Enviar sitemap

3. **Configurar Conversões no Google Ads**:
   - Criar ação de conversão
   - Configurar tag de conversão (já integrado via GTM)

4. **Criar Campanhas**:
   - Campanha de pesquisa
   - Campanha de display (opcional)
   - Campanha de shopping (se aplicável)

## URLs Importantes

- Site: https://www.centraldascertidoes.com
- Sitemap: https://www.centraldascertidoes.com/sitemap.xml
- Robots.txt: https://www.centraldascertidoes.com/robots.txt
- Política de Privacidade: https://www.centraldascertidoes.com/politica-de-privacidade
- Termos de Uso: https://www.centraldascertidoes.com/termos-de-uso
- Fale Conosco: https://www.centraldascertidoes.com/fale-conosco

## Suporte

Para dúvidas sobre configuração do Google Ads:
- Email: contato@centraldascertidoes.com
- Documentação: https://support.google.com/google-ads
