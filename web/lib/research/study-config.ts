/**
 * Configuração do estudo — personalize via variáveis de ambiente (.env.local)
 * ou edite os valores padrão abaixo (aprovados pelo CEP).
 *
 * Referências: Res. CNS 510/2016; CONEP — pesquisa em ambiente virtual; LGPD.
 */
export const studyConfig = {
  tcleVersion: "1.0.0",
  studyTitle: process.env.NEXT_PUBLIC_STUDY_TITLE ?? "Forrageamento Visual — Experimento 2",
  studyDurationMinutes: 10,
  taskDurationMinutes: 7,

  researcher: {
    name: process.env.NEXT_PUBLIC_RESEARCHER_NAME ?? "[Nome do(a) pesquisador(a) responsável]",
    email: process.env.NEXT_PUBLIC_RESEARCHER_EMAIL ?? "[email.pesquisador@instituicao.br]",
    phone: process.env.NEXT_PUBLIC_RESEARCHER_PHONE ?? "[(00) 0000-0000]",
    institution:
      process.env.NEXT_PUBLIC_RESEARCHER_INSTITUTION ??
      "[Instituição / Programa de Pós-Graduação]",
  },

  cep: {
    name: process.env.NEXT_PUBLIC_CEP_NAME ?? "[Nome do Comitê de Ética — CEP]",
    email: process.env.NEXT_PUBLIC_CEP_EMAIL ?? "[cep@instituicao.br]",
    phone: process.env.NEXT_PUBLIC_CEP_PHONE ?? "[(00) 0000-0000]",
    hours:
      process.env.NEXT_PUBLIC_CEP_HOURS ??
      "Segunda a sexta, das 9h às 17h (horário de Brasília)",
  },

  platform: {
    name: process.env.NEXT_PUBLIC_PLATFORM_NAME ?? "Vekon Research (hospedagem Vercel)",
    privacyUrl: process.env.NEXT_PUBLIC_PLATFORM_PRIVACY_URL ?? "https://vercel.com/legal/privacy-policy",
    dataRetentionYears: 5,
  },

  minAge: 18,
} as const;
