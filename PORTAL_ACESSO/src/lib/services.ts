import { Service } from '@/types';

const PORTAL_BASE = 'https://www.portalcertidao.org';

export const services: Service[] = [
  {
    id: 'acesso-criminal-federal',
    title: 'Certidão Criminal Federal',
    description: 'Acesse serviços digitais relacionados a consultas federais de forma rápida e segura',
    portalPath: `${PORTAL_BASE}/certidao/federais?type=criminal&source=portalcacesso`,
  },
  {
    id: 'acesso-quitacao-eleitoral',
    title: 'Certidão Quitação Eleitoral',
    description: 'Solicite acesso a serviços digitais de quitação eleitoral online',
    portalPath: `${PORTAL_BASE}/certidao/federais?type=eleitoral&source=portalcacesso`,
  },
  {
    id: 'acesso-antecedencia-pf',
    title: 'Certidão Antecedência PF',
    description: 'Conecte-se a serviços digitais de consulta de antecedentes',
    portalPath: `${PORTAL_BASE}/certidao/policia-federal?source=portalcacesso`,
  },
  {
    id: 'acesso-criminal-estadual',
    title: 'Certidão Criminal Estadual',
    description: 'Acesse plataforma online para serviços digitais estaduais',
    portalPath: `${PORTAL_BASE}/certidao/estaduais?source=portalcacesso`,
  },
  {
    id: 'acesso-civel-federal',
    title: 'Certidão Cível Federal',
    description: 'Solicite acesso a serviços digitais cíveis federais',
    portalPath: `${PORTAL_BASE}/certidao/federais?type=civel&source=portalcacesso`,
  },
  {
    id: 'acesso-civel-estadual',
    title: 'Certidão Cível Estadual',
    description: 'Conecte-se a serviços digitais cíveis estaduais',
    portalPath: `${PORTAL_BASE}/certidao/estaduais?type=civel&source=portalcacesso`,
  },
  {
    id: 'acesso-cnd',
    title: 'Certidão CND',
    description: 'Acesse serviços digitais de consulta de débitos online',
    portalPath: `${PORTAL_BASE}/certidao/cnd?source=portalcacesso`,
  },
  {
    id: 'acesso-cpf-regular',
    title: 'Certidão CPF Regular',
    description: 'Solicite acesso a serviços digitais de regularidade de CPF',
    portalPath: `${PORTAL_BASE}/certidao/cpf-regular?source=portalcacesso`,
  },
];

