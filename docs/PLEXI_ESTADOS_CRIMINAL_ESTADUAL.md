# Certidão Criminal Estadual - Documentação Plexi

**Fonte:** [Documentação oficial Plexi](https://crawly.atlassian.net/wiki/spaces/PLEXIAPI/overview)

---

## Estados com endpoint na Plexi (10 estados)

| Estado | Endpoint | Payload principal | Observação |
|--------|----------|------------------|------------|
| **SP** | `ssp-sp/antecedentes-criminais` | nome, cpf, sexo, dataNascimento, nomeMae | ✓ Implementado |
| **RJ** | `tjrj/certidao-judicial-eletronica` | nomeRequerente, cpfCnpj, email, comarca, modeloRequerimento: acoesCriminais | ✓ Implementado |
| **MG** | `pc-mg-atestado-antecedentes-criminais` | nome, rg, dataNascimento | **Exige RG** ✓ Implementado |
| **RS** | `tjrs/certidao-negativa` | tipo: 2 (criminal), cpfCnpj, nome, endereco, rg, nomeMae, dataNascimento | **Exige RG** ✓ Implementado |
| **ES** | `tjes/certidao-negativa` | instancia: 1, naturezaCertidao: 5 (criminal), cpfCnpj, nome | ✓ Implementado |
| **PA** | `tjpa/certidao-antecedentes-criminais` | requerente, nomeMae, endereco, cpf | **Exige nome da mãe** ✓ Implementado |
| **DF** | `tjdft/certidao-distribuicao` | tipoCertidao: "criminal", cpfCnpj, nome, nomeMae | **Exige nome da mãe** ✓ Implementado |
| **BA** | `tjba/consulta-primeiro-grau` | modelo: "criminalExecucaoPenal", cpfCnpj, nome, endereco, participacao | **Exige nome da mãe** ✓ Implementado |
| **CE** | `tjce/consulta-certidoes` | natureza: "criminal", tipoCertidao, cpf, nome, nomeMae, nomePai, dataNascimento, comarca | **Exige comarca** ✓ Implementado |
| **SC** | `tjsc/certidao` | modeloCertidao: "criminal", instanciaJudicial, cpfCnpj, nome, pais, estado, municipio, email, finalidade | ⚠️ **Exige certificado_id (Gov.BR)** - pode não funcionar sem autenticação Gov.BR |

---

## Estados SEM endpoint de certidão criminal na Plexi (17 estados)

| AC | AL | AM | AP | GO | MA | MS | MT | PB | PE | PI | PR | RN | RO | RR | SE | TO |
|---|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|

**Observação:** TJMT, TJMS, TJGO têm apenas "Consulta Processos", não certidão negativa. TJPR tem "Consulta Processual". Nenhum deles oferece certidão de antecedentes criminais via API Plexi.

---

## Resumo

- **Implementados no registry:** SP, RJ, MG, RS, ES, PA, DF, BA, CE (9 estados)
- **Disponível com restrição:** SC (exige Gov.BR)
- **Não disponíveis:** 17 estados
