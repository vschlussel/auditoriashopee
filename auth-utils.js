/* =========================================================================
   AUTH UTILS — funções compartilhadas entre cadastro, login, perfil e o app
   ========================================================================= */

const AuthUtils = (() => {

  function configurado() {
    return !!supabaseClient;
  }

  // Validação de CPF pelo algoritmo padrão de dígitos verificadores.
  function validarCPF(cpf) {
    const limpo = String(cpf || '').replace(/\D/g, '');
    if (limpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(limpo)) return false; // todos os dígitos iguais (ex: 111.111.111-11)

    const calcDigito = (base, pesoInicial) => {
      let soma = 0;
      for (let i = 0; i < base.length; i++) soma += parseInt(base[i], 10) * (pesoInicial - i);
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };

    const d1 = calcDigito(limpo.slice(0, 9), 10);
    const d2 = calcDigito(limpo.slice(0, 10), 11);
    return d1 === parseInt(limpo[9], 10) && d2 === parseInt(limpo[10], 10);
  }

  function formatarCPF(cpf) {
    const limpo = String(cpf || '').replace(/\D/g, '');
    if (limpo.length !== 11) return cpf;
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Validação de CNPJ pelo algoritmo padrão de dígitos verificadores.
  function validarCNPJ(cnpj) {
    const limpo = String(cnpj || '').replace(/\D/g, '');
    if (limpo.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(limpo)) return false;

    const calcDigito = (base, pesos) => {
      let soma = 0;
      for (let i = 0; i < base.length; i++) soma += parseInt(base[i], 10) * pesos[i];
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    const pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const d1 = calcDigito(limpo.slice(0, 12), pesos1);
    const d2 = calcDigito(limpo.slice(0, 12) + d1, pesos2);
    return limpo.slice(12) === `${d1}${d2}`;
  }

  function formatarCNPJ(cnpj) {
    const limpo = String(cnpj || '').replace(/\D/g, '');
    if (limpo.length !== 14) return cnpj;
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  async function getSessaoAtual() {
    if (!configurado()) return null;
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) { console.error('Erro ao obter sessão:', error); return null; }
    return data.session;
  }

  async function getPerfilAtual() {
    if (!configurado()) return null;
    const session = await getSessaoAtual();
    if (!session) return null;
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) { console.error('Erro ao obter perfil:', error); return null; }
    return data;
  }

  async function cadastrar(email, senha, dadosExtras = {}) {
    const { nomeLoja, nomeCompleto, cpf, telefone, aceitouPrivacidade } = dadosExtras;
    const { data, error } = await supabaseClient.auth.signUp({
      email, password: senha,
      options: { 
        data: {
          nome_loja: nomeLoja || null,
          nome_completo: nomeCompleto || null,
          cpf: cpf ? cpf.replace(/\D/g, '') : null,
          telefone: telefone || null
        }
      }
    });
    
    // Se o cadastro foi bem-sucedido, atualizar dados na tabela profiles também
    if (data && data.user) {
      await new Promise(r => setTimeout(r, 500)); // aguardar criação automática do perfil
      const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;
      await supabaseClient
        .from('profiles')
        .update({
          nome_completo: nomeCompleto || null,
          cpf: cpfLimpo,
          telefone: telefone || null,
          nome_loja: nomeLoja || null
        })
        .eq('id', data.user.id);
    }
    
    return { data, error };
  }

  async function login(email, senha) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    return { data, error };
  }

  async function loginComGoogle(redirectTo) {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo || (window.location.origin + '/perfil.html') }
    });
    return { data, error };
  }

  async function logout() {
    await supabaseClient.auth.signOut();
  }

  async function reenviarConfirmacao(email) {
    const { error } = await supabaseClient.auth.resend({ type: 'signup', email });
    return { error };
  }

  async function solicitarRedefinicaoSenha(email, redirectTo) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  }

  async function atualizarSenha(novaSenha) {
    const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });
    return { error };
  }

  async function atualizarPerfil(campos) {
    const session = await getSessaoAtual();
    if (!session) return { error: new Error('Sem sessão ativa.') };
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(campos)
      .eq('id', session.user.id)
      .select()
      .single();
    return { data, error };
  }

  const LIMITE_LOJAS = 3;

  async function listarLojas() {
    const session = await getSessaoAtual();
    if (!session) return { data: [], error: new Error('Sem sessão ativa.') };
    const { data, error } = await supabaseClient
      .from('lojas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    return { data: data || [], error };
  }

  async function criarLoja({ nome, cnpj, observacoes }) {
    const session = await getSessaoAtual();
    if (!session) return { error: new Error('Sem sessão ativa.') };
    const { data, error } = await supabaseClient
      .from('lojas')
      .insert({
        user_id: session.user.id,
        nome,
        cnpj: cnpj ? cnpj.replace(/\D/g, '') : null,
        observacoes: observacoes || null
      })
      .select()
      .single();
    return { data, error };
  }

  async function atualizarLoja(id, { nome, cnpj, observacoes }) {
    const session = await getSessaoAtual();
    if (!session) return { error: new Error('Sem sessão ativa.') };
    const { data, error } = await supabaseClient
      .from('lojas')
      .update({
        nome,
        cnpj: cnpj ? cnpj.replace(/\D/g, '') : null,
        observacoes: observacoes || null
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();
    return { data, error };
  }

  async function excluirLoja(id) {
    const session = await getSessaoAtual();
    if (!session) return { error: new Error('Sem sessão ativa.') };
    const { error } = await supabaseClient
      .from('lojas')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    return { error };
  }

  // Protege uma página: se não estiver configurado ou não houver sessão, redireciona.
  async function exigirLogin(redirectParaLogin = 'login.html') {
    if (!configurado()) {
      alert('O sistema de contas ainda não foi configurado (auth-config.js). Avise o administrador do site.');
      return null;
    }
    const session = await getSessaoAtual();
    if (!session) {
      window.location.href = `${redirectParaLogin}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return null;
    }
    return session;
  }

  const PLAN_LABELS = { free: 'Free', iniciante: 'Iniciante', pro: 'Pro' };

  return {
    configurado, getSessaoAtual, getPerfilAtual, cadastrar, login, loginComGoogle, logout,
    reenviarConfirmacao, solicitarRedefinicaoSenha, atualizarSenha, atualizarPerfil,
    exigirLogin, validarCPF, formatarCPF, validarCNPJ, formatarCNPJ,
    listarLojas, criarLoja, atualizarLoja, excluirLoja, LIMITE_LOJAS,
    PLAN_LABELS
  };
})();
