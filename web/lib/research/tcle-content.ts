import { studyConfig } from "./study-config";
import {
  cursorMethodologyNote,
  getOnlineResearchSections,
  tcleSimpleConsentLabel,
} from "./online-research-supplement";

export interface TcleSection {
  id: string;
  title: string;
  paragraphs: string[];
}

function institutionHeader(): string[] {
  return [
    "Universidade de São Paulo",
    "Instituto de Psicologia — Departamento de Psicologia Experimental",
    "Laboratório de Análise Experimental do Comportamento",
  ];
}

/** TCLE CEP-IPUSP (TCLE_DA_ajustado.pdf) + anexo online (orientações CONEP). */
export function getTcleSections(): TcleSection[] {
  const c = studyConfig;
  const onlineSections = getOnlineResearchSections();

  return [
    {
      id: "cabecalho",
      title: c.studyTitle,
      paragraphs: [
        ...institutionHeader(),
        "",
        "Você está sendo convidado(a) para participar como voluntário(a) em uma pesquisa em Análise Experimental do Comportamento. A seguir serão descritas as principais características desta pesquisa. Leia integralmente antes de consentir. Uma cópia deste termo deve ser guardada por você.",
      ],
    },
    {
      id: "informacoes",
      title: "Informações sobre a pesquisa",
      paragraphs: [
        "O objetivo desta pesquisa é estudar processos de atenção e escolha em tarefas visuais. Neste experimento, não será avaliada nenhuma medida de inteligência, aspectos afetivos nem emocionais.",
        `Nesta versão online, você participará individualmente em seu computador, por meio de aplicação web no navegador. ${cursorMethodologyNote} Você realizará escolhas pressionando teclas (por exemplo, a barra de espaço) conforme as instruções.`,
        "Não há eye-tracking, webcam, gravação de áudio, vídeo ou imagens faciais nesta modalidade.",
        "O risco previsto é mínimo, comparável ao uso habitual de computador (fadiga visual leve, monotonia). Participar não trará benefício direto de aprendizado de habilidades do dia a dia. O pesquisador responsável pode esclarecer dúvidas a qualquer momento.",
      ],
    },
    ...onlineSections,
    {
      id: "pesquisador",
      title: "Pesquisador responsável",
      paragraphs: [
        `O pesquisador responsável por esta pesquisa é ${c.researcher.name}, vinculado ao ${c.researcher.institution}, localizado na ${c.researcher.address}.`,
        `Contato: ${c.researcher.phone} · ${c.researcher.email}.`,
      ],
    },
    {
      id: "cep",
      title: "Comitê de Ética em Pesquisa",
      paragraphs: [
        `O ${c.cep.name} avaliou eticamente esta pesquisa.`,
        `Endereço: ${c.cep.address}. Telefone: ${c.cep.phone}. E-mail: ${c.cep.email}.`,
      ],
    },
    {
      id: "beneficios-sigilo",
      title: "Benefícios, confidencialidade e armazenamento",
      paragraphs: [
        "Não há benefícios monetários. Você não será identificado em publicações científicas ou materiais educativos.",
        "Ao consentir, você autoriza sua participação voluntária e pode retirar o consentimento a qualquer momento, sem prejuízo.",
        "Os dados serão armazenados de forma segura (HTTPS; acesso restrito à equipe). Consentimento identificável e dados comportamentais (código anônimo) ficam em arquivos separados.",
        `Retenção conforme normas institucionais (mínimo de ${c.platform.dataRetentionYears} anos quando aplicável). Base legal LGPD: consentimento para pesquisa científica (Art. 7º, I, e Art. 11, I, Lei 13.709/2018).`,
      ],
    },
    {
      id: "declaracao",
      title: "Termo de Consentimento Livre e Esclarecido",
      paragraphs: [
        "Declaro que, após convenientemente esclarecido pelo pesquisador e ter entendido o que me foi explicado, consinto em participar do presente Projeto de Pesquisa. Confirmo que recebi uma via deste termo de consentimento e que compreendo que sou livre para retirar-me do estudo em qualquer momento, sem qualquer penalidade. Dou meu consentimento de livre e espontânea vontade e sem reservas para participar deste estudo.",
      ],
    },
  ];
}

export function getTclePlainText(): string {
  const sections = getTcleSections();
  const lines = [
    "TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE) — VERSÃO ONLINE",
    `Versão: ${studyConfig.tcleVersion}`,
    "",
  ];
  for (const s of sections) {
    lines.push(s.title.toUpperCase());
    lines.push("");
    for (const p of s.paragraphs) {
      if (p) lines.push(p);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const tcleConsentDeclaration =
  "Declaro que, após convenientemente esclarecido pelo pesquisador e ter entendido o que me foi explicado, consinto em participar do presente Projeto de Pesquisa. Confirmo que recebi uma via deste termo de consentimento e que compreendo que sou livre para retirar-me do estudo em qualquer momento, sem qualquer penalidade. Dou meu consentimento de livre e espontânea vontade e sem reservas para participar deste estudo.";

export { tcleSimpleConsentLabel };

export const TCLE_PDF_PATH = "/tcle/TCLE_DA_ajustado.pdf";
