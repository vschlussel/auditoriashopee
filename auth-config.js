/* =========================================================================
   CONFIGURAÇÃO DO SUPABASE — edite só este arquivo
   =========================================================================
   Cole aqui as 2 informações que você pegou em:
   Supabase → seu projeto → Project Settings → API

   1) SUPABASE_URL → "Project URL" (algo como https://xxxxxxxxxxxx.supabase.co)
   2) SUPABASE_ANON_KEY → a chave pública do projeto. Pode aparecer como:
      - "anon / public key" (formato antigo, uma chave longa começando com eyJ...)
      - "Publishable key" (formato novo, começando com sb_publishable_...)
      Ambos os formatos funcionam igual — use o que aparecer no seu painel.

   Essas chaves são seguras para ficar no front-end — a proteção real dos dados
   está nas regras de Row Level Security configuradas no banco (veja setup.sql).
   ========================================================================= */

const SUPABASE_URL = 'https://owbsjdmgmwvkypdmhplo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S0i6GkegfCvMIyi9E2h15w_5EQsfPX1';

/* Não precisa editar nada abaixo desta linha. */
const chaveValida = SUPABASE_ANON_KEY.startsWith('ey') || SUPABASE_ANON_KEY.startsWith('sb_publishable_');
const supabaseClient = (SUPABASE_URL.startsWith('http') && chaveValida)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseClient) {
  console.error('Supabase não configurado: edite auth-config.js com sua URL e chave pública.');
}
