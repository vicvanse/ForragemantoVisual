import { studyConfig } from "./study-config";

export interface TcleSection {
  id: string;
  title: string;
  paragraphs: string[];
}

/** Seções do TCLE alinhadas à Res. CNS 510/2016 e orientações CONEP para ambiente virtual. */
export function getTcleSections(): TcleSection[] {
  const c = studyConfig;
  return [
    {
      id: "identificacao",
      title: "Identificação da pesquisa",
      paragraphs: [
        `Título: ${c.studyTitle}.`,
        `Pesquisador(a) responsável: ${c.researcher.name}, ${c.researcher.institution}.`,
        `Contato: ${c.researcher.email} | ${c.researcher.phone}.`,
        "Este estudo foi submetido ao Comitê de Ética em Pesquisa (CEP) e aprovado conforme protocolo vigente.",
      ],
    },
    {
      id: "convite",
      title: "Por que você foi convidado(a)?",
      paragraphs: [
        "Você foi convidado(a) a participar por atender aos critérios de inclusão do estudo (adulto, uso de computador com mouse, leitura em português).",
        "A participação é voluntária. A recusa não trará qualquer prejuízo.",
      ],
    },
    {
      id: "objetivo",
      title: "Objetivo",
      paragraphs: [
        "Investigar processos de atenção visual e escolha em uma tarefa de forrageamento, na qual você localiza a letra T entre distratores L, usando o mouse como indicador de atenção.",
      ],
    },
    {
      id: "procedimentos",
      title: "Procedimentos e duração",
      paragraphs: [
        "Após ler este termo e registrar seu consentimento, você receberá instruções e realizará a tarefa no navegador (aproximadamente 7 minutos). O procedimento total, incluindo TCLE e instruções, leva cerca de 10 minutos.",
        "Ferramenta: plataforma web segura (" + c.platform.name + "). Não há gravação de áudio, vídeo ou imagem facial.",
        "Dados coletados: movimentos do mouse, tempos de resposta, pontuação, eventos da sessão, código anônimo de participação e registro de consentimento. Não coletamos endereço IP.",
      ],
    },
    {
      id: "riscos",
      title: "Riscos e desconfortos",
      paragraphs: [
        "Risco mínimo, comparável ao uso habitual de computador. Pode ocorrer leve fadiga visual ou monotonia.",
        "Você pode interromper a qualquer momento fechando a janela do navegador, sem necessidade de justificativa.",
      ],
    },
    {
      id: "beneficios",
      title: "Benefícios",
      paragraphs: [
        "Não há benefício direto garantido. Os resultados poderão contribuir para pesquisa científica em cognição e atenção.",
      ],
    },
    {
      id: "sigilo",
      title: "Confidencialidade e proteção de dados (LGPD)",
      paragraphs: [
        "Seus dados serão identificados por um código alfanumérico gerado automaticamente, separado dos dados de contato quando possível.",
        "O acesso ficará restrito à equipe de pesquisa autorizada, com armazenamento seguro e criptografia em trânsito (HTTPS).",
        "Base legal (LGPD): consentimento do titular para fins de pesquisa científica (Art. 7º, I, e Art. 11, I, da Lei 13.709/2018).",
        `Os registros serão mantidos por no mínimo ${c.platform.dataRetentionYears} anos após o término da pesquisa, conforme Res. CNS 510/2016.`,
        `Política de privacidade da plataforma de hospedagem: ${c.platform.privacyUrl}`,
      ],
    },
    {
      id: "direitos",
      title: "Seus direitos",
      paragraphs: [
        "Você pode recusar participar ou retirar seu consentimento a qualquer momento, sem penalidade.",
        "Pode solicitar esclarecimentos ao pesquisador ou ao CEP antes, durante ou após a participação.",
        "Recomendamos guardar uma cópia deste termo (botão de download disponível nesta página).",
      ],
    },
    {
      id: "cep",
      title: "Comitê de Ética em Pesquisa (CEP)",
      paragraphs: [
        "O CEP é um colegiado independente que avalia projetos de pesquisa com seres humanos.",
        `${c.cep.name}`,
        `Contato: ${c.cep.email} | ${c.cep.phone}`,
        `Atendimento: ${c.cep.hours}`,
      ],
    },
    {
      id: "resultados",
      title: "Divulgação dos resultados",
      paragraphs: [
        "Os resultados agregados poderão ser publicados em relatórios científicos ou dissertação, sem identificação individual dos participantes.",
        "Mediante solicitação ao pesquisador, informações gerais sobre os achados poderão ser compartilhadas após a conclusão do estudo.",
      ],
    },
  ];
}

export function getTclePlainText(): string {
  const sections = getTcleSections();
  const lines = [
    "TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)",
    `Versão: ${studyConfig.tcleVersion}`,
    "",
  ];
  for (const s of sections) {
    lines.push(s.title.toUpperCase());
    lines.push("");
    for (const p of s.paragraphs) lines.push(p);
    lines.push("");
  }
  lines.push(
    "Declaro que li este termo, tive oportunidade de esclarecer dúvidas e concordo voluntariamente em participar.",
  );
  return lines.join("\n");
}
