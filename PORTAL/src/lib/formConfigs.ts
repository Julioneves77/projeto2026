export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string;
  showWhen?: { field: string; value: string };
}

export interface StepConfig {
  title: string;
  description?: string;
  fields: FieldConfig[];
}

export interface FormConfig {
  title: string;
  description: string;
  steps: StepConfig[];
}

const globalContactFields: FieldConfig[] = [
  { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, placeholder: "Seu nome completo" },
  { name: "telefone", label: "Telefone", type: "text", required: true, placeholder: "(00) 00000-0000" },
  { name: "email", label: "E-mail", type: "text", required: true, placeholder: "seu@email.com" },
];

const termsFields: FieldConfig[] = [
  { name: "termos", label: "Li e aceito os Termos de Uso e a Política de Privacidade (LGPD)", type: "checkbox", required: true },
];

// ESTADUAIS
const estaduaisConfigs: Record<string, FormConfig> = {
  df: {
    title: "Certidão Criminal - Distrito Federal",
    description: "Tribunal de Justiça do Distrito Federal e Territórios",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Contato e Confirmação", fields: [
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  go: {
    title: "Certidão Criminal - Goiás",
    description: "Tribunal de Justiça do Estado de Goiás",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Contato e Confirmação", fields: [
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  mt: {
    title: "Certidão Criminal - Mato Grosso",
    description: "Tribunal de Justiça do Estado de Mato Grosso",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Contato e Confirmação", fields: [
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  to: {
    title: "Certidão Criminal - Tocantins",
    description: "Tribunal de Justiça do Estado de Tocantins",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Contato e Confirmação", fields: [
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  ba: {
    title: "Certidão Criminal - Bahia",
    description: "Tribunal de Justiça do Estado da Bahia",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "rg", label: "RG", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "rgOrgaoEmissor", label: "Órgão Emissor do RG", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nacionalidade", label: "Nacionalidade", type: "select", required: true, options: "nacionalidades", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "estadoCivil", label: "Estado Civil", type: "select", required: true, options: "estadosCivis", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Endereço, Contato e Confirmação", fields: [
        { name: "enderecoCompleto", label: "Endereço Completo", type: "text", required: true },
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  rr: {
    title: "Certidão Criminal - Roraima",
    description: "Tribunal de Justiça do Estado de Roraima",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Contato e Confirmação", fields: [
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  rj: {
    title: "Certidão Criminal - Rio de Janeiro",
    description: "Tribunal de Justiça do Estado do Rio de Janeiro",
    steps: [
      { title: "Comarca", fields: [
        { name: "comarca", label: "Comarca", type: "select", required: true, options: "comarcasRJ" },
      ]},
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Finalidade, Contato e Confirmação", fields: [
        { name: "finalidade", label: "Finalidade", type: "select", required: true, options: "finalidadesRJ" },
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
  sp: {
    title: "Certidão Criminal - São Paulo",
    description: "Tribunal de Justiça do Estado de São Paulo",
    steps: [
      { title: "Modelo e Pessoa", fields: [
        { name: "modelo", label: "Modelo", type: "text", required: true },
        { name: "pessoa", label: "Pessoa", type: "text", required: true },
      ]},
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "rg", label: "RG", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Contato e Confirmação", fields: [
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
};

// Add remaining states with similar structure
["ro", "ap", "es", "ms", "rs", "sc", "al", "ce", "pb", "pe", "rn", "se", "ma"].forEach((state) => {
  if (!estaduaisConfigs[state]) {
    estaduaisConfigs[state] = {
      title: `Certidão Criminal - ${state.toUpperCase()}`,
      description: `Tribunal de Justiça do Estado`,
      steps: [
        { title: "Tipo de Documento", fields: [
          { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
          { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
          { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
          { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
          { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
          { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
          { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        ]},
        { title: "Contato e Confirmação", fields: [
          ...globalContactFields.slice(1),
          ...termsFields,
        ]},
      ],
    };
  }
});

// FEDERAIS
const federaisConfig: FormConfig = {
  title: "Certidão Federal",
  description: "Tribunal Regional Federal",
  steps: [
    { title: "Tipo de Certidão", fields: [
      { name: "tipoCertidao", label: "Tipo de Certidão", type: "select", required: true, options: "tipoCertidao" },
      { name: "estadoEmissao", label: "Estado de Emissão", type: "select", required: true, options: "estados" },
      { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
      { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      { name: "nomeFantasia", label: "Nome Fantasia", type: "text", required: false, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
    ]},
    { title: "Dados e Confirmação", fields: [
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true },
      ...globalContactFields.slice(1),
      ...termsFields,
    ]},
  ],
};

// Polícia Federal
const policiaFederalConfig: FormConfig = {
  title: "Antecedentes Criminais - Polícia Federal",
  description: "Certidão de Antecedentes Criminais",
  steps: [
    { title: "Dados Pessoais", fields: [
      { name: "cpf", label: "CPF", type: "text", required: true },
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true },
      { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA" },
      { name: "nacionalidade", label: "Nacionalidade", type: "select", required: true, options: "nacionalidades" },
    ]},
    { title: "Naturalidade, Contato e Confirmação", fields: [
      { name: "paisNascimento", label: "País de Nascimento", type: "select", required: true, options: "paises" },
      { name: "ufNascimento", label: "UF de Nascimento", type: "select", required: true, options: "estados" },
      { name: "municipioNascimento", label: "Município de Nascimento", type: "text", required: true },
      { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true },
      ...globalContactFields.slice(1),
      ...termsFields,
    ]},
  ],
};

// CND
const cndConfig: FormConfig = {
  title: "CND - Certidão Negativa de Débitos",
  description: "Certidão Negativa de Débitos Federais",
  steps: [
    { title: "Tipo de Documento", fields: [
      { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
      { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
    ]},
    { title: "Contato e Confirmação", fields: [
      ...globalContactFields.slice(1),
      ...termsFields,
    ]},
  ],
};

// CPF Regular
const cpfRegularConfig: FormConfig = {
  title: "Situação Cadastral do CPF",
  description: "Comprovante de Regularidade do CPF",
  steps: [
    { title: "Dados", fields: [
      { name: "cpf", label: "CPF", type: "text", required: true },
      { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA" },
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true },
    ]},
    { title: "Contato e Confirmação", fields: [
      ...globalContactFields.slice(1),
      ...termsFields,
    ]},
  ],
};

// Get available states (excluding MG and PR)
export function getAvailableStates() {
  const excludedStates = ["MG", "PR"];
  return [
    { sigla: "AL", nome: "Alagoas" },
    { sigla: "AP", nome: "Amapá" },
    { sigla: "BA", nome: "Bahia" },
    { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" },
    { sigla: "ES", nome: "Espírito Santo" },
    { sigla: "GO", nome: "Goiás" },
    { sigla: "MA", nome: "Maranhão" },
    { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "RN", nome: "Rio Grande do Norte" },
    { sigla: "RO", nome: "Rondônia" },
    { sigla: "RR", nome: "Roraima" },
    { sigla: "RS", nome: "Rio Grande do Sul" },
    { sigla: "SC", nome: "Santa Catarina" },
    { sigla: "SE", nome: "Sergipe" },
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "TO", nome: "Tocantins" },
  ].filter((s) => !excludedStates.includes(s.sigla));
}

export function getFormConfig(category: string, type: string): FormConfig | null {
  switch (category) {
    case "estaduais":
      return estaduaisConfigs[type] || null;
    case "federais":
      return { ...federaisConfig, title: `Certidão Federal - ${type.toUpperCase()}` };
    case "policia-federal":
      return policiaFederalConfig;
    case "cnd":
      return cndConfig;
    case "cpf-regular":
      return cpfRegularConfig;
    default:
      return null;
  }
}
