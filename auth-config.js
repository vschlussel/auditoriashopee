// ⚙️ CONFIGURAÇÃO SUPABASE
// Projeto: AUDITORIA SHOPEE

const SUPABASE_URL = 'https://owbsjdmgmwvkypdmhplo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S0i6GkegfCvMIyi9E2h15w_5EQsfPX1';

// Inicializar cliente Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase inicializado com sucesso');
