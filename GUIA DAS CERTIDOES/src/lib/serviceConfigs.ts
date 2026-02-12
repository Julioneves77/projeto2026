// ============================================================
// SERVICE FIELD CONFIGURATIONS — FONTE DA VERDADE
// ============================================================

export type FieldType = "text" | "select" | "radio" | "cpf" | "cnpj" | "date" | "cpfOrCnpj" | "cep";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  dependsOn?: { field: string; value: string };
}

export interface ServiceConfig {
  type: "federal" | "estadual";
  estadualType?: "criminal" | "civil";
  fields?: FieldConfig[];
}

// ============================================================
// UF CONSTANTS
// ============================================================

const ALL_UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

// UF_LIST para emissão estadual (sem MG e PR)
export const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","PA","PB","PE","PI","RJ","RN","RS","RO",
  "RR","SC","SP","SE","TO",
];

// ============================================================
// REUSABLE FIELD DEFINITIONS
// ============================================================

const nomeField: FieldConfig = {
  name: "nomeCompleto", label: "Nome completo", type: "text", required: true,
  placeholder: "Digite seu nome completo",
};

const cpfField: FieldConfig = {
  name: "cpf", label: "CPF", type: "cpf", required: true,
  placeholder: "000.000.000-00",
};

const cnpjField: FieldConfig = {
  name: "cnpj", label: "CNPJ", type: "cnpj", required: true,
  placeholder: "00.000.000/0000-00",
};

const dataNascField: FieldConfig = {
  name: "dataNascimento", label: "Data de nascimento", type: "date", required: true,
  placeholder: "00/00/0000",
};

const nomeMaeField: FieldConfig = {
  name: "nomeMae", label: "Nome completo da mãe", type: "text", required: true,
  placeholder: "Digite o nome completo da mãe",
};

const rgField: FieldConfig = {
  name: "rg", label: "RG", type: "text", required: true,
  placeholder: "Digite o RG",
};

const rgOrgaoEmissorField: FieldConfig = {
  name: "rgOrgaoEmissor", label: "Órgão emissor do RG", type: "text", required: true,
  placeholder: "Ex: SSP",
};

const tipoDocumentoField: FieldConfig = {
  name: "tipoDocumento", label: "Tipo de documento", type: "select", required: true,
  options: [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
  ],
};

const documentoField: FieldConfig = {
  name: "documento", label: "Documento", type: "cpfOrCnpj", required: true,
  placeholder: "Digite o documento",
};

const tipoPessoaField: FieldConfig = {
  name: "tipoPessoa", label: "Tipo de pessoa", type: "select", required: true,
  options: [
    { value: "pf", label: "Pessoa Física" },
    { value: "pj", label: "Pessoa Jurídica" },
  ],
};

const sexoRadioField: FieldConfig = {
  name: "sexo", label: "Sexo", type: "radio", required: true,
  options: [
    { value: "masculino", label: "Masculino" },
    { value: "feminino", label: "Feminino" },
  ],
};

const generoRadioField: FieldConfig = {
  name: "genero", label: "Gênero", type: "radio", required: true,
  options: [
    { value: "masculino", label: "Masculino" },
    { value: "feminino", label: "Feminino" },
  ],
};

const nacionalidadeField: FieldConfig = {
  name: "nacionalidade", label: "Nacionalidade", type: "select", required: true,
  options: [
    { value: "brasileira", label: "Brasileira" },
    { value: "estrangeira", label: "Estrangeira" },
    { value: "naturalizada", label: "Naturalizado(a)" },
  ],
};

const estadoCivilField: FieldConfig = {
  name: "estadoCivil", label: "Estado civil", type: "select", required: true,
  options: [
    { value: "solteiro", label: "Solteiro(a)" },
    { value: "casado", label: "Casado(a)" },
    { value: "divorciado", label: "Divorciado(a)" },
    { value: "viuvo", label: "Viúvo(a)" },
    { value: "separado", label: "Separado(a)" },
    { value: "uniao_estavel", label: "União Estável" },
  ],
};

const enderecoCompletoField: FieldConfig = {
  name: "enderecoCompleto", label: "Endereço completo", type: "text", required: true,
  placeholder: "Digite o endereço completo",
};

const razaoSocialField: FieldConfig = {
  name: "razaoSocial", label: "Razão Social", type: "text", required: true,
  placeholder: "Digite a razão social",
};

const cepField: FieldConfig = {
  name: "cep", label: "CEP", type: "cep", required: true,
  placeholder: "00000-000",
};

const paisNascimentoField: FieldConfig = {
  name: "paisNascimento", label: "País de nascimento", type: "text", required: true,
  placeholder: "Ex: Brasil",
};

const ufNascimentoField: FieldConfig = {
  name: "ufNascimento", label: "UF de nascimento", type: "select", required: true,
  options: ALL_UFS.map((u) => ({ value: u, label: u })),
};

const municipioNascimentoField: FieldConfig = {
  name: "municipioNascimento", label: "Município de nascimento", type: "text", required: true,
  placeholder: "Digite o município de nascimento",
};

const ufDocumentoField: FieldConfig = {
  name: "ufDocumento", label: "UF do documento", type: "select", required: true,
  options: ALL_UFS.map((u) => ({ value: u, label: u })),
};

const pessoaField: FieldConfig = {
  name: "pessoa", label: "Pessoa", type: "select", required: true,
  options: [
    { value: "pf", label: "Pessoa Física" },
    { value: "pj", label: "Pessoa Jurídica" },
  ],
};

const modeloField: FieldConfig = {
  name: "modelo", label: "Modelo", type: "text", required: true,
  placeholder: "Digite o modelo",
};

const tipoCertidaoField: FieldConfig = {
  name: "tipoCertidao", label: "Tipo de certidão", type: "text", required: true,
  placeholder: "Digite o tipo de certidão",
};

const instanciaField: FieldConfig = {
  name: "instancia", label: "Instância", type: "select", required: true,
  options: [
    { value: "1a", label: "1ª Instância" },
    { value: "2a", label: "2ª Instância" },
  ],
};

const naturezaField: FieldConfig = {
  name: "natureza", label: "Natureza", type: "select", required: true,
  options: [
    { value: "criminal", label: "Criminal" },
    { value: "civel", label: "Cível" },
  ],
};

// ============================================================
// RJ DATA
// ============================================================

export const COMARCAS_RJ = [
  "1ª Vara Criminal da Capital","2ª Vara Criminal da Capital","3ª Vara Criminal da Capital",
  "4ª Vara Criminal da Capital","5ª Vara Criminal da Capital","6ª Vara Criminal da Capital",
  "7ª Vara Criminal da Capital","8ª Vara Criminal da Capital","9ª Vara Criminal da Capital",
  "10ª Vara Criminal da Capital","11ª Vara Criminal da Capital","12ª Vara Criminal da Capital",
  "13ª Vara Criminal da Capital","14ª Vara Criminal da Capital","15ª Vara Criminal da Capital",
  "16ª Vara Criminal da Capital","17ª Vara Criminal da Capital","18ª Vara Criminal da Capital",
  "19ª Vara Criminal da Capital","20ª Vara Criminal da Capital","21ª Vara Criminal da Capital",
  "22ª Vara Criminal da Capital","23ª Vara Criminal da Capital","24ª Vara Criminal da Capital",
  "25ª Vara Criminal da Capital","26ª Vara Criminal da Capital","27ª Vara Criminal da Capital",
  "28ª Vara Criminal da Capital","29ª Vara Criminal da Capital","30ª Vara Criminal da Capital",
  "31ª Vara Criminal da Capital","32ª Vara Criminal da Capital","33ª Vara Criminal da Capital",
  "34ª Vara Criminal da Capital","35ª Vara Criminal da Capital","36ª Vara Criminal da Capital",
  "37ª Vara Criminal da Capital","38ª Vara Criminal da Capital","39ª Vara Criminal da Capital",
  "40ª Vara Criminal da Capital","1ª Vara Criminal de Niterói","2ª Vara Criminal de Niterói",
  "3ª Vara Criminal de Niterói","1ª Vara Criminal de Campos dos Goytacazes",
  "2ª Vara Criminal de Campos dos Goytacazes","1ª Vara Criminal de Duque de Caxias",
  "2ª Vara Criminal de Duque de Caxias","3ª Vara Criminal de Duque de Caxias",
  "1ª Vara Criminal de Nova Iguaçu","2ª Vara Criminal de Nova Iguaçu",
  "3ª Vara Criminal de Nova Iguaçu","1ª Vara Criminal de Petrópolis",
  "2ª Vara Criminal de Petrópolis","1ª Vara Criminal de Volta Redonda",
  "2ª Vara Criminal de Volta Redonda","1ª Vara Criminal de São Gonçalo",
  "2ª Vara Criminal de São Gonçalo","1ª Vara Criminal de Angra dos Reis",
  "1ª Vara Criminal de Barra Mansa","1ª Vara Criminal de Belford Roxo",
  "1ª Vara Criminal de Cabo Frio","1ª Vara Criminal de Macaé",
  "1ª Vara Criminal de Resende","1ª Vara Criminal de Teresópolis",
  "1ª Vara Criminal de Três Rios","1ª Vara Criminal de Valença",
  "Comarca de Angra dos Reis","Comarca de Araruama","Comarca de Barra Mansa",
  "Comarca de Belford Roxo","Comarca de Cabo Frio","Comarca de Cachoeiras de Macacu",
  "Comarca de Campos dos Goytacazes","Comarca de Duque de Caxias",
  "Comarca de Itaboraí","Comarca de Itaguaí","Comarca de Japeri",
  "Comarca de Macaé","Comarca de Magé","Comarca de Maricá",
  "Comarca de Mesquita","Comarca de Nilópolis","Comarca de Niterói",
  "Comarca de Nova Iguaçu","Comarca de Paracambi","Comarca de Petrópolis",
  "Comarca de Queimados","Comarca de Resende","Comarca de Rio das Ostras",
  "Comarca de Rio de Janeiro","Comarca de São Gonçalo",
  "Comarca de São João de Meriti","Comarca de Seropédica",
  "Comarca de Teresópolis","Comarca de Três Rios","Comarca de Valença",
  "Comarca de Volta Redonda",
];

export const FINALIDADES_RJ = [
  "Ação de Tutela","Adoção","Alienação Fiduciária","Aluguel",
  "Apresentação à Polícia Federal","Autorização de Viagem","Cadastro",
  "Carteira Profissional","Concursos Públicos","Credenciamento",
  "Emprego","Estágio","Financiamento","Inscrição em Conselho Profissional",
  "Instrução de Processo Administrativo","Instrução de Processo Judicial",
  "Licitação","Naturalização","Ordem Judicial","Posse em Cargo Público",
  "Porte de Arma","Prova de Vida","Registro em Órgão Público","Seguro",
  "Transferência de Imóvel","Universidade / Faculdade","Visto / Migração",
];

// ============================================================
// FEDERAL SERVICE CONFIGS
// ============================================================

export const serviceConfigs: Record<string, ServiceConfig> = {
  // 8) Antecedentes PF
  "Antecedentes Criminais": {
    type: "federal",
    fields: [
      cpfField,
      nomeField,
      dataNascField,
      nacionalidadeField,
      paisNascimentoField,
      ufNascimentoField,
      municipioNascimentoField,
      nomeMaeField,
    ],
  },
  // 7) Criminal Federal
  "Certidão Criminal Federal": {
    type: "federal",
    fields: [tipoDocumentoField, documentoField, nomeField],
  },
  // 7) Quitação Eleitoral
  "Certidão de Quitação Eleitoral": {
    type: "federal",
    fields: [tipoDocumentoField, documentoField, nomeField],
  },
  // 7) Cível Federal
  "Certidão Cível Federal": {
    type: "federal",
    fields: [tipoDocumentoField, documentoField, nomeField],
  },
  // 9) CND
  "Certidão Negativa de Débitos (CND)": {
    type: "federal",
    fields: [cpfField, dataNascField, nomeField],
  },
  // 10) CPF Regular
  "Certidão de CPF Regular": {
    type: "federal",
    fields: [cpfField, dataNascField, nomeField],
  },
  // Estaduais
  "Certidão Criminal Estadual": {
    type: "estadual",
    estadualType: "criminal",
  },
  "Certidão Cível Estadual": {
    type: "estadual",
    estadualType: "civil",
  },
  // Extras (sem definição no doc — campos básicos)
  "Certidão de Débito Trabalhista": {
    type: "federal",
    fields: [nomeField, cpfField],
  },
  "CCIR - Cadastro de Imóvel Rural": {
    type: "federal",
    fields: [nomeField, cpfField],
  },
};

// ============================================================
// ESTADUAL UF CONFIGS — CRIMINAL ESTADUAL (CAMPOS POR ESTADO)
// ============================================================

export const estadualUFConfigs: Record<string, FieldConfig[]> = {
  // DF / GO / MT
  DF: [nomeField, cpfField, nomeMaeField, dataNascField],
  GO: [nomeField, cpfField, nomeMaeField, dataNascField],
  MT: [nomeField, cpfField, nomeMaeField, dataNascField],

  // TO
  TO: [cpfField, nomeField],

  // BA
  BA: [
    nomeField,
    cpfField,
    rgField,
    rgOrgaoEmissorField,
    nomeMaeField,
    nacionalidadeField,
    estadoCivilField,
    enderecoCompletoField,
  ],

  // RR — tipoPessoa com campos condicionais
  RR: [
    tipoPessoaField,
    { ...nomeField, dependsOn: { field: "tipoPessoa", value: "pf" } },
    { ...cpfField, dependsOn: { field: "tipoPessoa", value: "pf" } },
    { ...razaoSocialField, dependsOn: { field: "tipoPessoa", value: "pj" } },
    { ...cnpjField, dependsOn: { field: "tipoPessoa", value: "pj" } },
  ],

  // RO — tipoPessoa com campos condicionais
  RO: [
    tipoPessoaField,
    { name: "nomeCompletoOuRazao", label: "Nome completo / Razão Social", type: "text", required: true, placeholder: "Digite o nome ou razão social" },
    { ...cpfField, dependsOn: { field: "tipoPessoa", value: "pf" } },
    { ...cnpjField, dependsOn: { field: "tipoPessoa", value: "pj" } },
  ],

  // AP
  AP: [
    nomeField,
    sexoRadioField,
    dataNascField,
    nomeMaeField,
    cpfField,
    rgField,
    ufDocumentoField,
  ],

  // RJ — comarca, tipoPessoa, dados, finalidade
  RJ: [
    {
      name: "comarca",
      label: "Comarca",
      type: "select",
      required: true,
      options: COMARCAS_RJ.map((c) => ({ value: c, label: c })),
    },
    tipoPessoaField,
    nomeField,
    {
      name: "cpfOuCnpj",
      label: "CPF ou CNPJ",
      type: "cpfOrCnpj",
      required: true,
      placeholder: "Digite o documento",
    },
    dataNascField,
    nomeMaeField,
    {
      name: "finalidade",
      label: "Finalidade",
      type: "select",
      required: true,
      options: [
        ...FINALIDADES_RJ.map((f) => ({ value: f, label: f })),
        { value: "Outra (digitar)", label: "Outra (digitar)" },
      ],
    },
    {
      name: "finalidadeOutra",
      label: "Finalidade (digite)",
      type: "text",
      required: true,
      placeholder: "Digite a finalidade",
      dependsOn: { field: "finalidade", value: "Outra (digitar)" },
    },
  ],

  // ES
  ES: [
    instanciaField,
    naturezaField,
    tipoPessoaField,
    nomeField,
    {
      name: "cpfOuCnpj",
      label: "CPF ou CNPJ",
      type: "cpfOrCnpj",
      required: true,
      placeholder: "Digite o documento",
    },
  ],

  // MS
  MS: [
    { name: "comarca", label: "Comarca", type: "text", required: true, placeholder: "Digite a comarca" },
    pessoaField,
    nomeField,
    cpfField,
    rgField,
    nomeMaeField,
    dataNascField,
  ],

  // SP
  SP: [
    pessoaField,
    nomeField,
    cpfField,
    rgField,
    nomeMaeField,
    dataNascField,
  ],

  // RS
  RS: [
    { name: "tipoDocumento", label: "Tipo de documento", type: "text", required: true, placeholder: "Digite o tipo de documento" },
    nomeField,
    sexoRadioField,
    cpfField,
    nomeMaeField,
    dataNascField,
    nacionalidadeField,
    estadoCivilField,
    { name: "rgNumero", label: "Número do RG", type: "text", required: true, placeholder: "Digite o número do RG" },
    { name: "rgOrgao", label: "Órgão emissor do RG", type: "text", required: true, placeholder: "Ex: SSP" },
    { name: "rgUf", label: "UF do RG", type: "select", required: true, options: ALL_UFS.map((u) => ({ value: u, label: u })) },
    { name: "endereco", label: "Endereço", type: "text", required: true, placeholder: "Digite o endereço completo" },
  ],

  // SC
  SC: [
    tipoPessoaField,
    nomeField,
    cpfField,
    rgField,
    rgOrgaoEmissorField,
    { name: "estadoResidencia", label: "Estado de residência", type: "select", required: true, options: ALL_UFS.map((u) => ({ value: u, label: u })) },
    { name: "municipioResidencia", label: "Município de residência", type: "text", required: true, placeholder: "Digite o município" },
    { name: "finalidadeCertidao", label: "Finalidade da certidão", type: "text", required: true, placeholder: "Digite a finalidade" },
  ],

  // AL
  AL: [
    pessoaField,
    nomeField,
    generoRadioField,
    nomeMaeField,
    dataNascField,
    nacionalidadeField,
    estadoCivilField,
  ],

  // CE
  CE: [
    pessoaField,
    cpfField,
    nomeField,
    dataNascField,
    nomeMaeField,
  ],

  // PB
  PB: [
    pessoaField,
    cpfField,
    nomeField,
    dataNascField,
    sexoRadioField,
    nomeMaeField,
    { name: "tipoDocumento", label: "Tipo de documento", type: "text", required: true, placeholder: "Ex: RG" },
    { name: "numeroDocumento", label: "Número do documento", type: "text", required: true, placeholder: "Digite o número" },
    { name: "orgaoDocumento", label: "Órgão emissor", type: "text", required: true, placeholder: "Ex: SSP" },
    ufDocumentoField,
    cepField,
    { name: "estado", label: "Estado", type: "select", required: true, options: ALL_UFS.map((u) => ({ value: u, label: u })) },
    { name: "municipio", label: "Município", type: "text", required: true, placeholder: "Digite o município" },
    { name: "logradouro", label: "Logradouro", type: "text", required: true, placeholder: "Digite o logradouro" },
    { name: "numeroEndereco", label: "Número", type: "text", required: true, placeholder: "Nº" },
  ],

  // PE
  PE: [nomeField, cpfField, dataNascField, nomeMaeField],

  // RN
  RN: [
    pessoaField,
    nomeField,
    rgField,
    { name: "orgaoEmissor", label: "Órgão emissor", type: "text", required: true, placeholder: "Ex: SSP" },
    cpfField,
    dataNascField,
    nomeMaeField,
    cepField,
    { name: "endereco", label: "Endereço", type: "text", required: true, placeholder: "Digite o endereço" },
    { name: "bairro", label: "Bairro", type: "text", required: true, placeholder: "Digite o bairro" },
    { name: "cidade", label: "Cidade", type: "text", required: true, placeholder: "Digite a cidade" },
    { name: "ufCidade", label: "UF", type: "select", required: true, options: ALL_UFS.map((u) => ({ value: u, label: u })) },
  ],

  // SE
  SE: [
    tipoPessoaField,
    { name: "domicilio", label: "Domicílio", type: "text", required: true, placeholder: "Digite a cidade de domicílio" },
    naturezaField,
    cpfField,
    nomeField,
    dataNascField,
    nomeMaeField,
  ],

  // MA
  MA: [
    nomeField,
    dataNascField,
    cpfField,
    rgField,
    nomeMaeField,
    { name: "estado", label: "Estado", type: "select", required: true, options: ALL_UFS.map((u) => ({ value: u, label: u })) },
    { name: "cidade", label: "Cidade", type: "text", required: true, placeholder: "Digite a cidade" },
    { name: "bairro", label: "Bairro", type: "text", required: true, placeholder: "Digite o bairro" },
    { name: "logradouro", label: "Logradouro", type: "text", required: true, placeholder: "Digite o logradouro" },
    { name: "numero", label: "Número", type: "text", required: true, placeholder: "Nº" },
  ],

  // AC (Acre)
  AC: [
    pessoaField,
    nomeField,
    cpfField,
    rgField,
    generoRadioField,
    nomeMaeField,
    dataNascField,
  ],

  // AM (Amazonas)
  AM: [
    { name: "comarca", label: "Comarca", type: "text", required: true, placeholder: "Digite a comarca" },
    pessoaField,
    nomeField,
    cpfField,
    rgField,
    generoRadioField,
    nomeMaeField,
    dataNascField,
  ],

  // PA (Pará) — Criminal
  PA: [
    nomeField,
    nomeMaeField,
    enderecoCompletoField,
    cpfField,
  ],

  // PI (Piauí)
  PI: [
    tipoPessoaField,
    { name: "grauJurisdicao", label: "Grau de Jurisdição", type: "select", required: true, options: [
      { value: "1grau", label: "1º Grau" },
      { value: "2grau", label: "2º Grau" },
    ]},
    nomeField,
  ],
};

// ============================================================
// HELPER
// ============================================================

export const getServiceConfig = (service: string): ServiceConfig => {
  return serviceConfigs[service] || { type: "federal", fields: [nomeField, cpfField] };
};
