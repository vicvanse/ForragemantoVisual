/**
 * Configuração do estudo — personalize via variáveis de ambiente (.env.local)
 * ou edite os valores padrão abaixo (aprovados pelo CEP-IPUSP).
 *
 * Referências: Res. CNS 510/2016; CONEP — pesquisa em ambiente virtual; LGPD.
 */
export const studyConfig = {
  tcleVersion: "1.0.0",
  studyTitle:
    process.env.NEXT_PUBLIC_STUDY_TITLE ??
    "Atenção dividida como escolha operante: Modelagem quantitativa de fixações do olhar e a lei da igualação",
  studyDurationMinutes: 10,
  taskDurationMinutes: 7,

  researcher: {
    name: process.env.NEXT_PUBLIC_RESEARCHER_NAME ?? "Víctor Correard Palmeira",
    email: process.env.NEXT_PUBLIC_RESEARCHER_EMAIL ?? "victorcorreard@usp.br",
    phone: process.env.NEXT_PUBLIC_RESEARCHER_PHONE ?? "(12) 99777-6662",
    institution:
      process.env.NEXT_PUBLIC_RESEARCHER_INSTITUTION ??
      "Instituto de Psicologia da Universidade de São Paulo (IPUSP)",
    address:
      process.env.NEXT_PUBLIC_RESEARCHER_ADDRESS ??
      "Av. Prof. Mello Moraes, 1.721, Cidade Universitária, São Paulo/SP, CEP 05508-030",
  },

  cep: {
    name:
      process.env.NEXT_PUBLIC_CEP_NAME ??
      "Comitê de Ética em Pesquisa com Seres Humanos do Instituto de Psicologia da Universidade de São Paulo (CEP-IPUSP)",
    email: process.env.NEXT_PUBLIC_CEP_EMAIL ?? "cep.ip@usp.br",
    phone: process.env.NEXT_PUBLIC_CEP_PHONE ?? "(11) 3091-4182",
    address:
      process.env.NEXT_PUBLIC_CEP_ADDRESS ??
      "Av. Prof. Mello Moraes, 1.721, Bloco G, 2º andar, sala 27, Cidade Universitária, São Paulo/SP, CEP 05508-030",
    hours:
      process.env.NEXT_PUBLIC_CEP_HOURS ??
      "Segunda a sexta, das 9h às 17h (horário de Brasília)",
  },

  platform: {
    name: process.env.NEXT_PUBLIC_PLATFORM_NAME ?? "Plataforma web (hospedagem Vercel)",
    privacyUrl: process.env.NEXT_PUBLIC_PLATFORM_PRIVACY_URL ?? "https://vercel.com/legal/privacy-policy",
    dataRetentionYears: 5,
  },

  minAge: 18,

  technical: {
    minViewportWidth: 1024,
    minViewportHeight: 600,
    supportedBrowsers: "Google Chrome, Mozilla Firefox ou Microsoft Edge (versões recentes)",
  },

  /**
   * Plano de sessões Exp. 2.
   * Teste: reps=1 → começa e termina em 60vs60, cada desigual 1× (6 sessões).
   * Ideal: reps=2 → 60vs60 duas vezes, depois cada desigual 2× em bloco (10 sessões).
   */
  sessionPlan: {
    repsPerCondition: Number(process.env.NEXT_PUBLIC_SESSION_REPS ?? 1),
    endWithEqual: true,
    forceTerminalEqual: false,
    durationS: Number(process.env.NEXT_PUBLIC_SESSION_DURATION_S ?? 420),
    /** Intervalo obrigatório entre sessões quando o participante continua na mesma visita. */
    interSessionBreakS: Number(process.env.NEXT_PUBLIC_INTER_SESSION_BREAK_S ?? 300),
  },
} as const;
