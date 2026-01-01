import { User, Ticket, RespostaPronta } from '@/types';

export const usuariosBase: User[] = [
  {
    id: 1,
    nome: "Administrador",
    email: "admin@empresasvirtuais.com",
    senha: "admin123",
    role: "admin",
    status: "ativo",
    valorPadrao: 0,
    valorPrioridade: 0,
    valorPremium: 0,
    metaDiariaCertidoes: 0
  },
  {
    id: 2,
    nome: "Financeiro",
    email: "financeiro@empresasvirtuais.com",
    senha: "financeiro123",
    role: "financeiro",
    status: "ativo",
    valorPadrao: 0,
    valorPrioridade: 0,
    valorPremium: 0,
    metaDiariaCertidoes: 0
  },
  {
    id: 3,
    nome: "Atendente",
    email: "atendente@empresasvirtuais.com",
    senha: "atendente123",
    role: "atendente",
    status: "ativo",
    valorPadrao: 1.00,
    valorPrioridade: 1.50,
    valorPremium: 2.00,
    metaDiariaCertidoes: 20
  }
];

export const respostasProntasBase: RespostaPronta[] = [
  { id: 1, texto: "Olá! Estamos verificando sua solicitação e retornaremos em breve." },
  { id: 2, texto: "Sua certidão está em processamento. Enviaremos por e-mail e WhatsApp quando concluir." },
  { id: 3, texto: "Precisamos de mais informações para prosseguir com sua solicitação. Por favor, entre em contato." },
  { id: 4, texto: "Sua certidão foi emitida com sucesso! Segue em anexo." }
];

export const ticketsMock: Ticket[] = [
  // GERAL - 4 tickets
  {
    id: "1",
    codigo: "TK-001",
    tipoPessoa: "CPF",
    nomeCompleto: "João Silva Santos",
    cpfSolicitante: "123.456.789-00",
    dataNascimento: "1985-05-15",
    genero: "Masculino",
    estadoEmissao: "São Paulo",
    cidadeEmissao: "São Paulo",
    telefone: "(11) 99999-1234",
    email: "joao.silva@email.com",
    tipoCertidao: "Certidão Negativa Criminal Federal",
    dominio: "certidoes.com.br",
    dataCadastro: new Date("2024-01-15T10:30:00"),
    prioridade: "premium",
    status: "GERAL",
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: []
  },
  {
    id: "5",
    codigo: "TK-005",
    tipoPessoa: "CPF",
    nomeCompleto: "Ana Carolina Mendes",
    cpfSolicitante: "111.222.333-44",
    dataNascimento: "1992-03-22",
    genero: "Feminino",
    estadoEmissao: "Paraná",
    cidadeEmissao: "Curitiba",
    telefone: "(41) 98765-4321",
    email: "ana.mendes@email.com",
    tipoCertidao: "Certidão de Casamento",
    dominio: "certidoes.com.br",
    dataCadastro: new Date("2024-01-18T09:00:00"),
    prioridade: "padrao",
    status: "GERAL",
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: []
  },
  {
    id: "6",
    codigo: "TK-006",
    tipoPessoa: "CNPJ",
    nomeCompleto: "ABC Comércio Ltda",
    cpfSolicitante: "98.765.432/0001-10",
    dataNascimento: "2015-07-01",
    genero: "Empresa",
    estadoEmissao: "Rio Grande do Sul",
    cidadeEmissao: "Porto Alegre",
    telefone: "(51) 91234-5678",
    email: "contato@abccomercio.com",
    tipoCertidao: "Certidão Negativa de Débitos",
    dominio: "empresarial.com.br",
    dataCadastro: new Date("2024-01-18T11:30:00"),
    prioridade: "prioridade",
    status: "GERAL",
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: []
  },
  {
    id: "7",
    codigo: "TK-007",
    tipoPessoa: "CPF",
    nomeCompleto: "Roberto Fernandes Lima",
    cpfSolicitante: "222.333.444-55",
    dataNascimento: "1988-11-30",
    genero: "Masculino",
    estadoEmissao: "Ceará",
    cidadeEmissao: "Fortaleza",
    telefone: "(85) 99876-5432",
    email: "roberto.lima@email.com",
    tipoCertidao: "Certidão de Óbito",
    dominio: "cartorio-online.com.br",
    dataCadastro: new Date("2024-01-18T14:00:00"),
    prioridade: "premium",
    status: "GERAL",
    operador: null,
    dataAtribuicao: null,
    dataConclusao: null,
    historico: []
  },
  // EM_OPERACAO - 4 tickets
  {
    id: "2",
    codigo: "TK-002",
    tipoPessoa: "CPF",
    nomeCompleto: "Maria Oliveira Lima",
    cpfSolicitante: "987.654.321-00",
    dataNascimento: "1990-08-22",
    genero: "Feminino",
    estadoEmissao: "Rio de Janeiro",
    cidadeEmissao: "Rio de Janeiro",
    telefone: "(21) 98888-5678",
    email: "maria.oliveira@email.com",
    tipoCertidao: "Certidão de Antecedentes Criminais",
    dominio: "certidoes.com.br",
    dataCadastro: new Date("2024-01-16T14:45:00"),
    prioridade: "padrao",
    status: "EM_OPERACAO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-16T15:00:00"),
    dataConclusao: null,
    historico: [
      {
        id: "h1",
        dataHora: new Date("2024-01-16T15:00:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Ticket atribuído para atendimento.",
        enviouEmail: false
      }
    ]
  },
  {
    id: "8",
    codigo: "TK-008",
    tipoPessoa: "CPF",
    nomeCompleto: "Patricia Santos Souza",
    cpfSolicitante: "333.444.555-66",
    dataNascimento: "1995-01-10",
    genero: "Feminino",
    estadoEmissao: "Minas Gerais",
    cidadeEmissao: "Uberlândia",
    telefone: "(34) 98765-1234",
    email: "patricia.souza@email.com",
    tipoCertidao: "Certidão Negativa Criminal Estadual",
    dominio: "certidoes.com.br",
    dataCadastro: new Date("2024-01-17T08:00:00"),
    prioridade: "prioridade",
    status: "EM_OPERACAO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-17T08:30:00"),
    dataConclusao: null,
    historico: [
      {
        id: "h6",
        dataHora: new Date("2024-01-17T08:30:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Iniciando processamento.",
        enviouEmail: false
      }
    ]
  },
  {
    id: "9",
    codigo: "TK-009",
    tipoPessoa: "CNPJ",
    nomeCompleto: "XYZ Tecnologia S.A.",
    cpfSolicitante: "11.222.333/0001-44",
    dataNascimento: "2018-06-15",
    genero: "Empresa",
    estadoEmissao: "Santa Catarina",
    cidadeEmissao: "Florianópolis",
    telefone: "(48) 99999-8888",
    email: "contato@xyztec.com.br",
    tipoCertidao: "Certidão de Regularidade Fiscal",
    dominio: "empresarial.com.br",
    dataCadastro: new Date("2024-01-17T10:00:00"),
    prioridade: "premium",
    status: "EM_OPERACAO",
    operador: "Financeiro",
    dataAtribuicao: new Date("2024-01-17T10:30:00"),
    dataConclusao: null,
    historico: [
      {
        id: "h7",
        dataHora: new Date("2024-01-17T10:30:00"),
        autor: "Financeiro",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Ticket em análise financeira.",
        enviouEmail: false
      }
    ]
  },
  {
    id: "10",
    codigo: "TK-010",
    tipoPessoa: "CPF",
    nomeCompleto: "Fernando Costa Almeida",
    cpfSolicitante: "444.555.666-77",
    dataNascimento: "1982-09-05",
    genero: "Masculino",
    estadoEmissao: "Pernambuco",
    cidadeEmissao: "Recife",
    telefone: "(81) 98888-7777",
    email: "fernando.almeida@email.com",
    tipoCertidao: "Certidão de Nascimento",
    dominio: "cartorio-online.com.br",
    dataCadastro: new Date("2024-01-17T14:00:00"),
    prioridade: "padrao",
    status: "EM_OPERACAO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-17T14:30:00"),
    dataConclusao: null,
    historico: [
      {
        id: "h8",
        dataHora: new Date("2024-01-17T14:30:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Processando solicitação.",
        enviouEmail: false
      }
    ]
  },
  // AGUARDANDO_INFO - 1 ticket
  {
    id: "4",
    codigo: "TK-004",
    tipoPessoa: "CPF",
    nomeCompleto: "Carlos Eduardo Pereira",
    cpfSolicitante: "456.789.123-00",
    dataNascimento: "1978-12-03",
    genero: "Masculino",
    estadoEmissao: "Bahia",
    cidadeEmissao: "Salvador",
    telefone: "(71) 96666-3456",
    email: "carlos.pereira@email.com",
    tipoCertidao: "Certidão de Nascimento",
    dominio: "cartorio-online.com.br",
    dataCadastro: new Date("2024-01-17T08:00:00"),
    prioridade: "padrao",
    status: "AGUARDANDO_INFO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-17T08:30:00"),
    dataConclusao: null,
    historico: [
      {
        id: "h4",
        dataHora: new Date("2024-01-17T08:30:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Ticket em análise.",
        enviouEmail: false
      },
      {
        id: "h5",
        dataHora: new Date("2024-01-17T09:00:00"),
        autor: "Atendente",
        statusAnterior: "EM_OPERACAO",
        statusNovo: "AGUARDANDO_INFO",
        mensagem: "Aguardando documento de identidade.",
        enviouEmail: true
      }
    ]
  },
  // CONCLUIDO - 5 tickets (incluindo alguns de hoje)
  {
    id: "3",
    codigo: "TK-003",
    tipoPessoa: "CNPJ",
    nomeCompleto: "Tech Solutions Ltda",
    cpfSolicitante: "12.345.678/0001-90",
    dataNascimento: "2010-03-10",
    genero: "Empresa",
    estadoEmissao: "Minas Gerais",
    cidadeEmissao: "Belo Horizonte",
    telefone: "(31) 97777-9012",
    email: "contato@techsolutions.com",
    tipoCertidao: "Certidão Negativa de Débitos",
    dominio: "empresarial.com.br",
    dataCadastro: new Date("2024-01-14T09:15:00"),
    prioridade: "prioridade",
    status: "CONCLUIDO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-14T10:00:00"),
    dataConclusao: new Date(),
    historico: [
      {
        id: "h2",
        dataHora: new Date("2024-01-14T10:00:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Iniciando processamento.",
        enviouEmail: false
      },
      {
        id: "h3",
        dataHora: new Date(),
        autor: "Atendente",
        statusAnterior: "EM_OPERACAO",
        statusNovo: "CONCLUIDO",
        mensagem: "Certidão emitida com sucesso!",
        enviouEmail: true,
        anexo: {
          nome: "certidao_tech_solutions.pdf",
          url: "#",
          tipo: "application/pdf"
        }
      }
    ]
  },
  {
    id: "11",
    codigo: "TK-011",
    tipoPessoa: "CPF",
    nomeCompleto: "Luciana Martins Rocha",
    cpfSolicitante: "555.666.777-88",
    dataNascimento: "1993-04-18",
    genero: "Feminino",
    estadoEmissao: "Goiás",
    cidadeEmissao: "Goiânia",
    telefone: "(62) 99999-1111",
    email: "luciana.rocha@email.com",
    tipoCertidao: "Certidão de Casamento",
    dominio: "certidoes.com.br",
    dataCadastro: new Date("2024-01-15T10:00:00"),
    prioridade: "padrao",
    status: "CONCLUIDO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-15T10:30:00"),
    dataConclusao: new Date(),
    historico: [
      {
        id: "h9",
        dataHora: new Date("2024-01-15T10:30:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Iniciando processamento.",
        enviouEmail: false
      },
      {
        id: "h10",
        dataHora: new Date(),
        autor: "Atendente",
        statusAnterior: "EM_OPERACAO",
        statusNovo: "CONCLUIDO",
        mensagem: "Certidão emitida.",
        enviouEmail: true
      }
    ]
  },
  {
    id: "12",
    codigo: "TK-012",
    tipoPessoa: "CPF",
    nomeCompleto: "Ricardo Batista Nunes",
    cpfSolicitante: "666.777.888-99",
    dataNascimento: "1979-07-25",
    genero: "Masculino",
    estadoEmissao: "Espírito Santo",
    cidadeEmissao: "Vitória",
    telefone: "(27) 98888-2222",
    email: "ricardo.nunes@email.com",
    tipoCertidao: "Certidão Negativa Criminal Federal",
    dominio: "certidoes.com.br",
    dataCadastro: new Date("2024-01-16T09:00:00"),
    prioridade: "premium",
    status: "CONCLUIDO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-16T09:30:00"),
    dataConclusao: new Date(),
    historico: [
      {
        id: "h11",
        dataHora: new Date("2024-01-16T09:30:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Processando.",
        enviouEmail: false
      },
      {
        id: "h12",
        dataHora: new Date(),
        autor: "Atendente",
        statusAnterior: "EM_OPERACAO",
        statusNovo: "CONCLUIDO",
        mensagem: "Concluído com sucesso.",
        enviouEmail: true
      }
    ]
  },
  {
    id: "13",
    codigo: "TK-013",
    tipoPessoa: "CNPJ",
    nomeCompleto: "Delta Serviços ME",
    cpfSolicitante: "22.333.444/0001-55",
    dataNascimento: "2020-01-15",
    genero: "Empresa",
    estadoEmissao: "Amazonas",
    cidadeEmissao: "Manaus",
    telefone: "(92) 99999-3333",
    email: "delta@deltaservicos.com",
    tipoCertidao: "Certidão de Regularidade Fiscal",
    dominio: "empresarial.com.br",
    dataCadastro: new Date("2024-01-17T07:00:00"),
    prioridade: "prioridade",
    status: "CONCLUIDO",
    operador: "Financeiro",
    dataAtribuicao: new Date("2024-01-17T07:30:00"),
    dataConclusao: new Date(),
    historico: [
      {
        id: "h13",
        dataHora: new Date("2024-01-17T07:30:00"),
        autor: "Financeiro",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Análise iniciada.",
        enviouEmail: false
      },
      {
        id: "h14",
        dataHora: new Date(),
        autor: "Financeiro",
        statusAnterior: "EM_OPERACAO",
        statusNovo: "CONCLUIDO",
        mensagem: "Certidão fiscal emitida.",
        enviouEmail: true
      }
    ]
  },
  {
    id: "14",
    codigo: "TK-014",
    tipoPessoa: "CPF",
    nomeCompleto: "Camila Ribeiro Costa",
    cpfSolicitante: "777.888.999-00",
    dataNascimento: "1991-12-08",
    genero: "Feminino",
    estadoEmissao: "Distrito Federal",
    cidadeEmissao: "Brasília",
    telefone: "(61) 98888-4444",
    email: "camila.costa@email.com",
    tipoCertidao: "Certidão de Óbito",
    dominio: "cartorio-online.com.br",
    dataCadastro: new Date("2024-01-17T11:00:00"),
    prioridade: "padrao",
    status: "CONCLUIDO",
    operador: "Atendente",
    dataAtribuicao: new Date("2024-01-17T11:30:00"),
    dataConclusao: new Date(),
    historico: [
      {
        id: "h15",
        dataHora: new Date("2024-01-17T11:30:00"),
        autor: "Atendente",
        statusAnterior: "GERAL",
        statusNovo: "EM_OPERACAO",
        mensagem: "Em processamento.",
        enviouEmail: false
      },
      {
        id: "h16",
        dataHora: new Date(),
        autor: "Atendente",
        statusAnterior: "EM_OPERACAO",
        statusNovo: "CONCLUIDO",
        mensagem: "Finalizado.",
        enviouEmail: true
      }
    ]
  }
];
