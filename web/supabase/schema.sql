-- Schema para persistência do estudo Forrageamento (Vercel + Supabase)
-- Cole no SQL Editor do projeto Supabase e execute.

-- Participantes (progresso + TCLE metadata)
create table if not exists public.participants (
  email_hash text primary key,
  email text not null,
  participant_id text not null unique,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists participants_participant_id_idx
  on public.participants (participant_id);

-- Submissões de sessão (dados comportamentais + consentimento)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  base_name text not null,
  participant_id text not null,
  session_condition int,
  sequence_index int,
  behavior jsonb not null,
  summary jsonb,
  events_csv text,
  summary_csv text,
  analysis_csv text,
  reinforcements_csv text,
  dwell_bins_csv text,
  visits_csv text,
  cursor_samples_csv text,
  region_transitions_csv text,
  txt_report text,
  consent_json jsonb,
  consent_txt text,
  signature_base64 text,
  created_at timestamptz not null default now()
);

create index if not exists submissions_participant_id_idx
  on public.submissions (participant_id);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

-- Bucket privado para CSV/JSON/PNG (opcional, mas recomendado)
-- Layout no Storage (prefixos separados):
--   behavior/{baseName}/…   — eventos, summary, análises (sem PII)
--   consent/{participantId}/[{baseName}/]… — TCLE, assinatura (identificável)
insert into storage.buckets (id, name, public)
values ('forrageamento', 'forrageamento', false)
on conflict (id) do nothing;

-- RLS: APIs usam service_role (bypassa RLS). Bloqueia acesso anônimo.
alter table public.participants enable row level security;
alter table public.submissions enable row level security;

-- Sem policies para anon/authenticated → só service_role lê/escreve.

-- Migração (se a tabela já existir):
-- alter table public.submissions add column if not exists analysis_csv text;
-- alter table public.submissions add column if not exists reinforcements_csv text;
-- alter table public.submissions add column if not exists dwell_bins_csv text;
-- alter table public.submissions add column if not exists visits_csv text;
-- alter table public.submissions add column if not exists cursor_samples_csv text;
-- alter table public.submissions add column if not exists region_transitions_csv text;
-- alter table public.submissions add column if not exists txt_report text;
