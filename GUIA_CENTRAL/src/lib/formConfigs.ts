import { ESTADOS_BRASIL } from "./constants";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string;
  showWhen?: { field: string; value: string };
  // Tipo condicional: quando showWhenType está definido, o tipo muda baseado no valor do campo referenciado
  showWhenType?: { field: string; whenValue: string; type: "text" | "select" };
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
  /** Certidões com entrega automática via Plexi (processamento digital e envio por e-mail) */
  entregaAutomatica?: boolean;
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
    title: "Certidão Negativa Criminal - Distrito Federal",
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
    title: "Certidão Negativa Criminal - Goiás",
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
    title: "Certidão Negativa Criminal - Mato Grosso",
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
    title: "Certidão Negativa Criminal - Tocantins",
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
    title: "Certidão Negativa Criminal - Bahia",
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
    title: "Certidão Negativa Criminal - Roraima",
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
    title: "Certidão Negativa Criminal - Rio de Janeiro",
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
    title: "Certidão Negativa Criminal - São Paulo",
    description: "Tribunal de Justiça do Estado de São Paulo",
    steps: [
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
  rs: {
    title: "Certidão Negativa Criminal - Rio Grande do Sul",
    description: "Tribunal de Justiça do Estado do Rio Grande do Sul",
    steps: [
      { title: "Tipo de Documento", fields: [
        { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
        { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "rg", label: "RG", type: "text", required: true, placeholder: "Número do RG", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "rgOrgaoEmissor", label: "Órgão Expedidor", type: "text", required: true, placeholder: "Ex: SSP/RS", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
        { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
        { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      ]},
      { title: "Endereço, Contato e Confirmação", fields: [
        { name: "enderecoCompleto", label: "Endereço", type: "text", required: true, placeholder: "Endereço completo" },
        ...globalContactFields.slice(1),
        ...termsFields,
      ]},
    ],
  },
};

// Add remaining states with similar structure
["ac", "al", "am", "ap", "ce", "es", "ma", "ms", "pa", "pb", "pe", "pi", "rn", "ro", "sc", "se"].forEach((state) => {
  if (!estaduaisConfigs[state]) {
    const step1Fields: FieldConfig[] = [
      { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
      { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "nomeMae", label: "Nome da Mãe", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
      ...(state === "ce" ? [{ name: "comarca", label: "Comarca", type: "text" as const, required: true, placeholder: "Ex: Fortaleza, Sobral", showWhen: { field: "tipoDocumento", value: "CPF" } }] : []),
      { name: "cnpj", label: "CNPJ", type: "text", required: true, placeholder: "00.000.000/0000-00", showWhen: { field: "tipoDocumento", value: "CNPJ" } },
      { name: "razaoSocial", label: "Razão Social", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CNPJ" } },
    ];
    const step2Fields: FieldConfig[] = [
      ...(state === "pa" ? [{ name: "enderecoCompleto", label: "Endereço Completo", type: "text" as const, required: true }] : []),
      ...globalContactFields.slice(1),
      ...termsFields,
    ];
    estaduaisConfigs[state] = {
      title: `Certidão Negativa Criminal - ${state.toUpperCase()}`,
      description: `Tribunal de Justiça do Estado`,
      steps: [
        { title: "Tipo de Documento", fields: step1Fields },
        { title: state === "pa" ? "Endereço, Contato e Confirmação" : "Contato e Confirmação", fields: step2Fields },
      ],
    };
  }
});

// FEDERAIS
const federaisConfig: FormConfig = {
  title: "Certidão Federal",
  description: "Tribunal Regional Federal",
  entregaAutomatica: true,
  steps: [
    { title: "Tipo de Certidão", fields: [
      { name: "tipoCertidao", label: "Tipo de Certidão", type: "select", required: true, options: "tipoCertidao" },
      { name: "estadoEmissao", label: "Estado de Emissão da certidão", type: "select", required: true, options: "estados" },
      { name: "tipoDocumento", label: "Tipo de Documento", type: "select", required: true, options: "tipoDocumento" },
      { name: "cpf", label: "CPF", type: "text", required: true, placeholder: "000.000.000-00", showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true, showWhen: { field: "tipoDocumento", value: "CPF" } },
      { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA", showWhen: { field: "tipoDocumento", value: "CPF" } },
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
  entregaAutomatica: true,
  steps: [
    { title: "Dados Pessoais", fields: [
      { name: "cpf", label: "CPF", type: "text", required: true },
      { name: "nomeCompleto", label: "Nome Completo", type: "text", required: true },
      { name: "dataNascimento", label: "Data de Nascimento", type: "text", required: true, placeholder: "DD/MM/AAAA" },
      { name: "nacionalidade", label: "Nacionalidade", type: "select", required: true, options: "nacionalidades" },
    ]},
    { title: "Naturalidade, Contato e Confirmação", fields: [
      // País de Nascimento: select para brasileiro, text para estrangeiro
      { 
        name: "paisNascimento", 
        label: "País de Nascimento", 
        type: "select", 
        required: true, 
        options: "paises",
        showWhen: { field: "nacionalidade", value: "Brasileiro(a)" }
      },
      { 
        name: "paisNascimento", 
        label: "País de Nascimento", 
        type: "text", 
        required: true,
        placeholder: "Digite o país de nascimento",
        showWhen: { field: "nacionalidade", value: "Estrangeiro(a)" }
      },
      // Estado de Nascimento: select para brasileiro, text para estrangeiro
      { 
        name: "ufNascimento", 
        label: "Estado de Nascimento", 
        type: "select", 
        required: true, 
        options: "estados",
        showWhen: { field: "nacionalidade", value: "Brasileiro(a)" }
      },
      { 
        name: "ufNascimento", 
        label: "Estado de Nascimento", 
        type: "text", 
        required: true,
        placeholder: "Digite o estado/província de nascimento",
        showWhen: { field: "nacionalidade", value: "Estrangeiro(a)" }
      },
      // Município de Nascimento: sempre texto
      { name: "municipioNascimento", label: "Município de Nascimento", type: "text", required: true },
      // Cidade de Nascimento: apenas para brasileiros
      { 
        name: "cidadeNascimento", 
        label: "Cidade de Nascimento", 
        type: "text", 
        required: true,
        placeholder: "Digite a cidade de nascimento",
        showWhen: { field: "nacionalidade", value: "Brasileiro(a)" }
      },
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
  entregaAutomatica: true,
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
  entregaAutomatica: true,
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
  return ESTADOS_BRASIL.filter((s) => !excludedStates.includes(s.sigla));
}

export function getFormConfig(category: string, type: string): FormConfig | null {
  switch (category) {
    case "estaduais":
      const cfg = estaduaisConfigs[type];
      return cfg ? { ...cfg, entregaAutomatica: true } : null;
    case "federais":
      const tipoMap: Record<string, string> = {
        "criminal": "Certidão Negativa Criminal Federal",
        "eleitoral": "Certidão Negativa Eleitoral",
        "civel": "Certidão Negativa Cível Federal",
        "cível": "Certidão Negativa Cível Federal",
      };
      return { 
        ...federaisConfig, 
        title: tipoMap[type.toLowerCase()] || `Certidão Negativa ${type.toUpperCase()} Federal`
      };
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
