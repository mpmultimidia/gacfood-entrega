// Vercel Serverless Function (Node runtime).
// Serve a mesma página de src/paginas/motoboy.ts do servidor local — mas
// aqui ela é o PRÓPRIO site, hospedada fora da rede do restaurante, porque
// depois de carregada ela só fala com o Supabase (nunca com o servidor local).
//
// Configure em Vercel → Project Settings → Environment Variables:
//   SUPABASE_URL
//   SUPABASE_PUBLISHABLE_KEY   (a anon key — segura de expor no navegador)
// Depois de configurar, faça um redeploy pra elas entrarem em vigor.
module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>GACFOOD — Motoboy</title>
<style>
  :root{
    --bg:#0b1220; --card:#141b2d; --border:#232c42; --text:#e5e9f0; --muted:#8892a6;
    --accent:#e94560; --green:#27ae60;
  }
  *{box-sizing:border-box;}
  body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text);}
  header{padding:16px;background:var(--card);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:5;}
  header h1{font-size:1.05rem;margin:0;}
  #btn-sair{background:none;border:1px solid var(--border);color:var(--muted);border-radius:8px;padding:6px 10px;font-size:0.75rem;}
  .container{padding:16px;max-width:480px;margin:0 auto;}
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;}
  label{display:block;font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;}
  input{width:100%;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:1rem;margin-bottom:14px;}
  input:focus{outline:none;border-color:var(--accent);}
  button{width:100%;padding:13px;border:none;border-radius:8px;font-size:0.95rem;font-weight:700;cursor:pointer;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-confirmar{background:var(--green);color:#fff;margin-top:10px;}
  .btn-confirmar:disabled{opacity:0.5;}
  .erro{color:var(--accent);font-size:0.82rem;margin-top:-8px;margin-bottom:12px;display:none;}
  .pedido-num{font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
  .pedido-cliente{font-size:1.05rem;font-weight:700;margin:2px 0 8px;}
  .pedido-linha{display:flex;gap:8px;font-size:0.85rem;color:var(--text);margin-bottom:4px;}
  .pedido-linha .ic{width:18px;flex-shrink:0;}
  .pedido-valor{font-size:1.1rem;font-weight:700;color:var(--green);margin-top:8px;}
  .vazio{text-align:center;color:var(--muted);padding:40px 12px;font-size:0.9rem;}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);padding:10px 18px;border-radius:8px;font-size:0.85rem;opacity:0;transition:opacity 0.25s;pointer-events:none;z-index:20;}
  .toast.show{opacity:1;}
  .toast.err{border-color:var(--accent);color:var(--accent);}
  #tela-carregando{text-align:center;color:var(--muted);padding:60px 12px;}
</style>
</head>
<body>

<header>
  <h1>🛵 GACFOOD Motoboy</h1>
  <button id="btn-sair" onclick="sair()" style="display:none;">Sair</button>
</header>

<div class="container">

  <div id="tela-carregando" class="vazio">Carregando...</div>

  <!-- LOGIN -->
  <div id="tela-login" class="card" style="display:none;">
    <label>Usuário</label>
    <input id="login-usuario" autocomplete="username" placeholder="Seu login">
    <label>Senha</label>
    <input id="login-senha" type="password" autocomplete="current-password" placeholder="Sua senha" onkeydown="if(event.key==='Enter') fazerLogin()">
    <div class="erro" id="login-erro"></div>
    <button class="btn-primary" onclick="fazerLogin()" id="btn-login">Entrar</button>
  </div>

  <!-- LISTA DE ENTREGAS -->
  <div id="tela-entregas" style="display:none;">
    <div id="lista-entregas"></div>
  </div>

</div>

<div class="toast" id="toast"></div>

<script>
const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL || "")};
const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || "")};

function toast(msg, tipo) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (tipo === 'err' ? ' err' : '');
  setTimeout(() => t.className = 'toast', 2500);
}

async function rpc(fn, body) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('Falha na comunicação (' + r.status + ')');
  return r.json();
}

function getToken() { return localStorage.getItem('motoboy_token'); }
function getNome() { return localStorage.getItem('motoboy_nome'); }

// ─── Envio de GPS ───────────────────────────────────────────────────────
// Manda a posição a cada 20s enquanto a tela de entregas estiver ativa,
// via RPC atualizar_localizacao_motoboy (já criada no Supabase).
let intervalGps = null;

function iniciarEnvioGps() {
  if (intervalGps || !navigator.geolocation) return;
  const enviar = () => {
    const token = getToken();
    if (!token) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        rpc('atualizar_localizacao_motoboy', {
          p_token: token,
          p_lat: pos.coords.latitude,
          p_lng: pos.coords.longitude
        }).catch((e) => console.warn('GPS não sincronizado:', e.message));
      },
      (err) => console.warn('GPS indisponível:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  };
  enviar();
  intervalGps = setInterval(enviar, 20000);
}

function pararEnvioGps() {
  if (intervalGps) { clearInterval(intervalGps); intervalGps = null; }
}

function mostrarTela(id) {
  ['tela-carregando','tela-login','tela-entregas'].forEach(t =>
    document.getElementById(t).style.display = (t === id ? '' : 'none')
  );
  document.getElementById('btn-sair').style.display = (id === 'tela-entregas') ? '' : 'none';
  if (id === 'tela-entregas') iniciarEnvioGps(); else pararEnvioGps();
}

async function fazerLogin() {
  const usuario = document.getElementById('login-usuario').value.trim();
  const senha = document.getElementById('login-senha').value;
  const erroEl = document.getElementById('login-erro');
  erroEl.style.display = 'none';

  if (!usuario || !senha) {
    erroEl.textContent = 'Preencha usuário e senha';
    erroEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.textContent = 'Entrando...';
  try {
    const resultado = await rpc('login_motoboy', { p_login: usuario, p_senha: senha });

    if (!resultado || !resultado.ok) {
      erroEl.textContent = 'Usuário ou senha inválidos';
      erroEl.style.display = 'block';
      return;
    }

    localStorage.setItem('motoboy_token', resultado.token);
    localStorage.setItem('motoboy_nome', resultado.motoboy.nome);
    document.getElementById('login-senha').value = '';
    await carregarEntregas();
  } catch (e) {
    erroEl.textContent = 'Erro de conexão. Tente novamente.';
    erroEl.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

function sair() {
  localStorage.removeItem('motoboy_token');
  localStorage.removeItem('motoboy_nome');
  mostrarTela('tela-login');
}

function fmt(v) {
  return (Number(v) || 0).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
}

function fmtHora(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' });
}

async function carregarEntregas() {
  const token = getToken();
  if (!token) { mostrarTela('tela-login'); return; }

  try {
    const entregas = await rpc('listar_minhas_entregas', { p_token: token });

    if (!Array.isArray(entregas)) throw new Error('SESSAO_INVALIDA');

    document.querySelector('header h1').textContent = '🛵 Olá, ' + (getNome() || 'motoboy');
    mostrarTela('tela-entregas');

    const lista = document.getElementById('lista-entregas');
    if (entregas.length === 0) {
      lista.innerHTML = '<div class="vazio">Nenhuma entrega no momento 🎉<br>Puxe para atualizar.</div>';
      return;
    }

    // Zero menus: mostra SÓ a próxima entrega (já vem ordenada por
    // prioridade pelo motor do servidor local, empurrada pro Supabase).
    const p = entregas[0];
    const restantes = entregas.length - 1;

    lista.innerHTML = \`
      <div class="card">
        <div class="pedido-num">Pedido #\${p.numero_cupom ?? p.pedido_id_local} · saiu às \${fmtHora(p.horario_saida)}</div>
        <div class="pedido-cliente">\${p.cliente_nome}</div>
        <div class="pedido-linha"><span class="ic">📍</span><span>\${p.endereco}\${p.referencia ? ' — ' + p.referencia : ''}</span></div>
        \${p.cliente_telefone ? '<div class="pedido-linha"><span class="ic">📞</span><span>' + p.cliente_telefone + '</span></div>' : ''}
        <div class="pedido-valor">\${fmt(p.valor)}</div>
        <button class="btn-confirmar" onclick="confirmarEntrega('\${p.id}', this)">✅ Confirmar Pedido Entregue</button>
      </div>
      \${restantes > 0 ? '<div class="vazio" style="padding:14px 0 0;font-size:0.78rem;">+ ' + restantes + ' entrega(s) depois desta</div>' : ''}
    \`;
  } catch (e) {
    sair();
    toast('Sessão expirada, entre novamente', 'err');
  }
}

async function confirmarEntrega(entregaId, btn) {
  if (!confirm('Confirmar que este pedido foi entregue?')) return;
  btn.disabled = true; btn.textContent = 'Confirmando...';
  try {
    const resultado = await rpc('confirmar_entrega', { p_token: getToken(), p_entrega_id: entregaId });
    if (!resultado || !resultado.ok) {
      toast(resultado?.error || 'Não foi possível confirmar', 'err');
      btn.disabled = false; btn.textContent = '✅ Confirmar Pedido Entregue';
      return;
    }
    toast('Entrega confirmada!');
    carregarEntregas();
  } catch (e) {
    toast('Erro de conexão', 'err');
    btn.disabled = false; btn.textContent = '✅ Confirmar Pedido Entregue';
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && getToken()) carregarEntregas();
});

setInterval(() => { if (getToken()) carregarEntregas(); }, 20000);

if (getToken()) carregarEntregas(); else mostrarTela('tela-login');
</script>

</body>
</html>`);
};
