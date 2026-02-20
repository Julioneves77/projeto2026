/**
 * Backend do Chat Guia Central
 * Roteador determinístico - sem loop, sem JSON no balão
 */

require("dotenv").config();
const express = require("express");
const path = require("path");

const SITE_BASE = process.env.SITE_BASE_URL || "https://guia-central.online";
const SERVICE_LINKS = {
  criminal_federal: "/certidao/federais?type=criminal",
  criminal_estadual: "/certidao/estaduais",
  pf_antecedentes: "/certidao/policia-federal",
  quitacao_eleitoral: "/certidao/federais?type=eleitoral",
  civel_federal: "/certidao/federais?type=civel",
  civel_estadual: "/certidao/estaduais?type=civel",
  cnd: "/certidao/cnd",
  cpf_regular: "/certidao/cpf-regular",
};

const SERVICE_LABELS = {
  criminal_federal: "Certidão Negativa Criminal Federal",
  criminal_estadual: "Certidão Negativa Criminal Estadual",
  pf_antecedentes: "Antecedentes Criminais da Polícia Federal",
  quitacao_eleitoral: "Certidão de Quitação Eleitoral",
  civel_federal: "Certidão Negativa Cível Federal",
  civel_estadual: "Certidão Negativa Cível Estadual",
  cnd: "Certidão Negativa de Débitos (CND)",
  cpf_regular: "Certidão CPF Regular",
};

function normalize(text) {
  if (!text || typeof text !== "string") return "";
  let t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  return t;
}

function hasToken(text, tokens) {
  const n = normalize(text);
  const words = n.split(/\s+/);
  for (const tok of tokens) {
    if (n.includes(tok) || words.includes(tok)) return true;
  }
  return false;
}

function routeMessage(text) {
  const n = normalize(text);

  if (hasToken(text, ["pf", "p.f.", "policia federal", "federal police"])) {
    return { kind: "answer", service_id: "pf_antecedentes", service_label: SERVICE_LABELS.pf_antecedentes };
  }
  if (hasToken(text, ["antecedentes criminais", "antecedente", "antecedentes"])) {
    return { kind: "answer", service_id: "pf_antecedentes", service_label: SERVICE_LABELS.pf_antecedentes };
  }

  if (hasToken(text, ["criminal federal"]) || (hasToken(text, ["criminal"]) && hasToken(text, ["federal", "uniao"]))) {
    return { kind: "answer", service_id: "criminal_federal", service_label: SERVICE_LABELS.criminal_federal };
  }
  if (hasToken(text, ["criminal estadual", "criminal estado"]) || (hasToken(text, ["criminal"]) && hasToken(text, ["estadual", "estado"]))) {
    return { kind: "answer", service_id: "criminal_estadual", service_label: SERVICE_LABELS.criminal_estadual };
  }
  if (hasToken(text, ["criminal", "criminais"]) && !hasToken(text, ["federal", "estadual", "estado"])) {
    return { kind: "choice", choice: "criminal" };
  }

  if (hasToken(text, ["civel federal", "civil federal"]) || (hasToken(text, ["civel", "civil"]) && hasToken(text, ["federal", "uniao"]))) {
    return { kind: "answer", service_id: "civel_federal", service_label: SERVICE_LABELS.civel_federal };
  }
  if (hasToken(text, ["civel estadual", "civil estadual"]) || (hasToken(text, ["civel", "civil"]) && hasToken(text, ["estadual", "estado"]))) {
    return { kind: "answer", service_id: "civel_estadual", service_label: SERVICE_LABELS.civel_estadual };
  }
  if (hasToken(text, ["civil", "civel"])) {
    return { kind: "choice", choice: "civil" };
  }

  if (hasToken(text, ["quitacao", "eleitoral", "titulo de eleitor", "titulo eleitor"])) {
    return { kind: "answer", service_id: "quitacao_eleitoral", service_label: SERVICE_LABELS.quitacao_eleitoral };
  }
  if (hasToken(text, ["cnd", "debito", "debitos", "dividas"])) {
    return { kind: "answer", service_id: "cnd", service_label: SERVICE_LABELS.cnd };
  }
  if (hasToken(text, ["cpf", "cpf regular", "regularizar cpf", "situacao cpf"])) {
    return { kind: "answer", service_id: "cpf_regular", service_label: SERVICE_LABELS.cpf_regular };
  }

  if (hasToken(text, ["emprego", "concurso", "trabalho"])) {
    return { kind: "choice", choice: "criminal" };
  }
  if (hasToken(text, ["viagem", "visto", "passaporte"])) {
    return { kind: "answer", service_id: "pf_antecedentes", service_label: SERVICE_LABELS.pf_antecedentes };
  }
  if (hasToken(text, ["processo", "acao", "judicial", "justica"])) {
    return { kind: "choice", choice: "civil" };
  }
  if (hasToken(text, ["debito", "divida", "licitacao", "empresa"])) {
    return { kind: "answer", service_id: "cnd", service_label: SERVICE_LABELS.cnd };
  }
  if (hasToken(text, ["eleitor", "votar", "regularizacao eleitoral"])) {
    return { kind: "answer", service_id: "quitacao_eleitoral", service_label: SERVICE_LABELS.quitacao_eleitoral };
  }

  if (hasToken(text, ["nascimento", "obito", "casamento", "objeto e pe", "certidao de nascimento", "certidao de obito", "certidao de casamento"])) {
    return { kind: "finalidade" };
  }

  return { kind: "finalidade" };
}

const MSG_CRIMINAL_CHOICE = `Você tem 3 opções:<br><br>
• <strong>Criminal Federal</strong>: exigências nacionais (ex.: concursos).<br>
• <strong>Criminal Estadual</strong>: exigências dentro do estado.<br>
• <strong>Antecedentes da Polícia Federal</strong>: viagens, vistos ou exigência específica.<br><br>
Qual você precisa?`;

const MSG_CIVIL_CHOICE = `Você tem 2 opções:<br><br>
• <strong>Cível Federal</strong>: processos/ações em âmbito federal.<br>
• <strong>Cível Estadual</strong>: processos/ações no estado.<br><br>
Qual você precisa?`;

const MSG_FINALIDADE = `Qual a finalidade? Ex: emprego, concurso, processo, regularização, viagem.`;

function buildResponse(route) {
  if (route.kind === "answer") {
    const label = route.service_label;
    const url = SERVICE_LINKS[route.service_id] ? SITE_BASE + SERVICE_LINKS[route.service_id] : null;
    const msg = `<strong>${label}</strong><br><br>Clique em <strong>ABRIR FORMULÁRIO</strong> para continuar.`;
    return { msg, service_id: route.service_id, service_label: label, kind: "answer", url };
  }
  if (route.kind === "choice") {
    const msg = route.choice === "criminal" ? MSG_CRIMINAL_CHOICE : MSG_CIVIL_CHOICE;
    return { msg, service_id: null, service_label: null, kind: "choice", url: null };
  }
  return { msg: MSG_FINALIDADE, service_id: null, service_label: null, kind: "finalidade", url: null };
}

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_MESSAGE_LENGTH = 600;
const ALLOWED_ORIGINS = [
  "https://guia-central.online",
  "https://www.guia-central.online",
  "http://guia-central.online",
  "http://www.guia-central.online",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/api/chat", (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ msg: "Digite sua mensagem.", service_id: null, service_label: null, kind: "answer", url: null });
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({ msg: "Digite sua mensagem.", service_id: null, service_label: null, kind: "answer", url: null });
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ msg: "Resuma sua dúvida em uma frase, por favor.", service_id: null, service_label: null, kind: "answer", url: null });
    }

    const route = routeMessage(trimmed);
    const payload = buildResponse(route);
    return res.json(payload);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Chat error:", err.message);
    }
    return res.status(500).json({
      msg: "Não consegui responder agora. Tente novamente.",
      service_id: null,
      service_label: null,
      kind: "answer",
      url: null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Chat Guia Central rodando em http://localhost:${PORT}`);
});
