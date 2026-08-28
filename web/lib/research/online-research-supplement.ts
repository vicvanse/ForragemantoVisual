import { studyConfig } from "./study-config";

/** Campos registrados ou deriváveis na análise (transparência metodológica). */
export const recordedDataFields = [
  "participant_id (código numérico anônimo, sem nome)",
  "condition / session_condition (condição experimental)",
  "ratio_label (proporção de estímulos por painel)",
  "event_index, t_session_s, event_type (eventos discretos da sessão)",
  "active_side, n_L_left, n_L_right, points_total",
  "detail (reforço, decaimento, troca de painel, etc.)",
  "duration_s_run, forage_time_left_s, forage_time_right_s",
  "cod_switch_count, points_total, aborted (sessão completa ou interrompida)",
  "viewportW, viewportH (resolução da janela no envio)",
  "mode (online_mouse), tcleVersion, submittedAt, platform",
] as const;

export const tcleSimpleConsentLabel =
  "Li as informações acima e concordo em participar voluntariamente desta pesquisa.";

export const cursorMethodologyNote =
  "Nesta versão online, a posição do cursor controla um ponteiro na tela e revela qual região você está observando. Isso é uma resposta operante de observação explícita — não é eye-tracking e não deve ser interpretado como medida direta do movimento dos olhos.";

export function getOnlineResearchSections() {
  const c = studyConfig;
  return [
    {
      id: "modalidade-online",
      title: "Modalidade online (participação remota)",
      paragraphs: [
        "A participação ocorre remotamente, em computador pessoal, por meio de uma aplicação web acessada pelo navegador. Não é necessário instalar programas.",
        `Duração total estimada: cerca de ${c.studyDurationMinutes} minutos (TCLE, instruções e verificação do ambiente incluídos; tarefa principal: ~${c.taskDurationMinutes} minutos).`,
        cursorMethodologyNote,
        "Requisitos técnicos: computador ou notebook com mouse (ou trackpad preciso); navegador recente (Chrome, Firefox ou Edge); resolução mínima recomendada de 1024×600 pixels; celular e tablet não são adequados para esta tarefa.",
      ],
    },
    {
      id: "dados-coletados",
      title: "O que o sistema registra",
      paragraphs: [
        "Durante a tarefa, o sistema utiliza a posição do cursor em tempo real para controlar o ponteiro na tela e detectar permanência nas regiões de interesse. Não há eye-tracking, gravação de webcam, captura de imagens, áudio ou vídeo.",
        "Dados comportamentais salvos ao final da sessão (associados apenas ao código anônimo participant_id): " +
          recordedDataFields.join("; ") +
          ".",
        "Dados de consentimento (nome, e-mail, assinatura, data/hora, fuso horário) são armazenados em arquivo separado dos dados comportamentais. O nome e o e-mail não entram nos arquivos de eventos da tarefa.",
        "Metadados técnicos mínimos no registro de consentimento: idioma do navegador, user-agent (tipo/versão do navegador) e dimensões da janela — para diagnóstico técnico. Endereço IP não é coletado intencionalmente por esta aplicação.",
      ],
    },
    {
      id: "plataforma-privacidade",
      title: "Privacidade da plataforma de hospedagem",
      paragraphs: [
        `A aplicação é hospedada em ${c.platform.name}. Serviços de hospedagem podem registrar automaticamente dados de infraestrutura (como endereço IP, logs de acesso, cookies técnicos ou identificadores de sessão do provedor) conforme a política do serviço.`,
        `O pesquisador adotou medidas de minimização: a aplicação não solicita IP nem grava trajetória contínua do cursor além do necessário para a lógica da tarefa; os dados experimentais são transmitidos via HTTPS.`,
        `Consulte a política de privacidade do provedor: ${c.platform.privacyUrl}. Em caso de dúvida sobre dados tratados pelo hospedeiro, contate o pesquisador responsável.`,
      ],
    },
    {
      id: "risco-virtual",
      title: "Riscos do ambiente virtual",
      paragraphs: [
        "Além do risco mínimo habitual do uso de computador, a participação remota pela internet envolve o risco característico de quebra de confidencialidade ou interceptação de dados durante a transmissão, mesmo com medidas de segurança.",
        "Medidas adotadas: transmissão criptografada (HTTPS), código anônimo para dados comportamentais, separação entre consentimento identificável e arquivos da tarefa, armazenamento restrito à equipe de pesquisa e orientação para realizar a sessão em local privado.",
      ],
    },
    {
      id: "desistencia",
      title: "Desistência e sessões incompletas",
      paragraphs: [
        "Você pode fechar a página ou abandonar a tarefa a qualquer momento, sem penalidade e sem prejuízo em relação ao pesquisador ou à instituição.",
        "Se você interromper antes de concluir e enviar a sessão, os dados comportamentais parciais dessa tentativa não são salvos automaticamente pelo sistema.",
        "Se desejar retirar o consentimento após ter concluído a participação, ou solicitar exclusão dos dados já enviados, entre em contato com o pesquisador responsável pelo e-mail indicado neste termo.",
      ],
    },
    {
      id: "copia-tcle",
      title: "Cópia do termo de consentimento",
      paragraphs: [
        "Recomenda-se fortemente que você baixe e guarde uma cópia deste TCLE antes ou ao consentir (botões “Baixar uma cópia do TCLE (PDF)” e “Baixar TCLE online (texto)” nesta página). Essa recomendação segue orientações da CONEP para pesquisa em ambiente virtual.",
      ],
    },
  ];
}
