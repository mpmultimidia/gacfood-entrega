// Vercel Serverless Function (Node runtime).
// Serve a mesma página de src/paginas/motoboy/ do servidor local — mas
// aqui ela é o PRÓPRIO site, hospedada fora da rede do restaurante, porque
// depois de carregada ela só fala com o Supabase (nunca com o servidor local).
//
// Configure em Vercel → Project Settings → Environment Variables:
//   SUPABASE_URL
//   SUPABASE_PUBLISHABLE_KEY   (a anon key — segura de expor no navegador)
//   GACFOOD_CIDADE_PADRAO      (ex: "Rio de Janeiro, RJ" — usada só como
//                                dica pro mapa geocodificar o endereço do
//                                cliente quando o texto do endereço não tem
//                                cidade/UF. Uma variável por restaurante.)
// Depois de configurar, faça um redeploy pra elas entrarem em vigor.
module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>GACFOOD — Motoboy</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  :root{
    --bg:#0b1220; --card:#141b2d; --card2:#0f1521; --border:#232c42; --text:#e5e9f0; --muted:#8892a6;
    --accent:#e94560; --green:#27ae60; --green2:#22c55e; --orange:#f39c12; --blue:#3498db;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text);}
  button{font-family:inherit;cursor:pointer;}
  input,select,textarea{font-family:inherit;}
  .container{padding:16px;max-width:480px;margin:0 auto;padding-bottom:90px;}

  header.app-header{padding:16px;background:var(--card);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10;}
  .header-esquerda{display:flex;align-items:center;gap:12px;}
  .avatar-circulo{width:40px;height:40px;border-radius:50%;background:var(--card2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;}
  .header-saudacao{font-size:1.02rem;font-weight:700;}
  .header-sino{background:none;border:1px solid var(--border);color:var(--muted);border-radius:8px;padding:8px 10px;font-size:0.95rem;}
  #btn-sair{background:none;border:1px solid var(--border);color:var(--muted);border-radius:8px;padding:8px 10px;font-size:0.8rem;}

  .bottom-nav{position:fixed;bottom:0;left:0;right:0;background:var(--card);border-top:1px solid var(--border);display:flex;z-index:15;max-width:480px;margin:0 auto;}
  .nav-item{flex:1;background:none;border:none;color:var(--muted);padding:10px 0 8px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:0.68rem;}
  .nav-item span:first-child{font-size:1.25rem;}
  .nav-item.active{color:var(--green2);}

  .resumo-pendentes{background:linear-gradient(135deg,var(--green),var(--green2));border-radius:14px;padding:18px;margin-bottom:16px;color:#06210f;}
  .resumo-topo{font-size:0.85rem;font-weight:700;opacity:0.85;}
  .resumo-numero{font-size:2.6rem;font-weight:800;margin:4px 0 6px;}
  .resumo-atualizado{font-size:0.75rem;opacity:0.85;display:flex;align-items:center;gap:6px;}
  .resumo-atualizado button{background:rgba(255,255,255,0.25);border:none;color:#06210f;border-radius:6px;padding:2px 8px;font-size:0.8rem;font-weight:700;}

  .filtro-tabs{display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;}
  .filtro-tab{flex:none;background:var(--card);border:1px solid var(--border);color:var(--muted);padding:8px 14px;border-radius:20px;font-size:0.8rem;font-weight:600;white-space:nowrap;}
  .filtro-tab.active{background:var(--green2);border-color:var(--green2);color:#06210f;}

  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;}
  label{display:block;font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;}
  input{width:100%;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:1rem;margin-bottom:14px;}
  input:focus{outline:none;border-color:var(--accent);}
  button{width:100%;padding:13px;border:none;border-radius:8px;font-size:0.95rem;font-weight:700;}
  button:disabled{opacity:0.5;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-confirmar{background:var(--green);color:#fff;margin-top:10px;}
  .btn-deslocamento{background:#2980b9;color:#fff;margin-top:10px;}
  .btn-ocorrencia{background:#f39c12;color:#fff;margin-top:10px;}
  .btn-ver-detalhes{background:transparent;color:var(--accent);border:1px solid var(--border);margin-top:8px;font-size:0.8rem;padding:9px;}
  .login-logo{text-align:center;margin-bottom:6px;}
  .login-logo-icon{font-size:2.2rem;line-height:1;}
  .login-logo-texto{font-size:1.5rem;font-weight:800;letter-spacing:0.5px;margin-top:4px;}
  .login-logo-texto span{color:var(--green);}
  .login-logo-sub{font-size:0.7rem;color:var(--muted);letter-spacing:3px;margin-top:2px;}
  .login-subtitulo{text-align:center;color:var(--muted);font-size:0.85rem;margin:14px 0 18px;}
  .login-campo{position:relative;margin-bottom:14px;}
  .login-campo input{padding-left:38px;margin-bottom:0;}
  .login-icone{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:0.95rem;opacity:0.7;}
  .login-lembrar{display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--text);margin-bottom:16px;cursor:pointer;}
  .login-lembrar input{width:auto;margin:0;}
  .login-esqueceu{text-align:center;margin-top:14px;font-size:0.82rem;}
  .login-esqueceu a{color:var(--muted);text-decoration:underline;}
  .login-versao{text-align:center;color:var(--muted);font-size:0.7rem;margin-top:22px;opacity:0.6;}
  .erro{color:var(--accent);font-size:0.82rem;margin-top:-8px;margin-bottom:12px;display:none;}
  .pedido-num{font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
  .pedido-cliente{font-size:1.05rem;font-weight:700;margin:2px 0 8px;}
  .pedido-linha{display:flex;gap:8px;font-size:0.85rem;color:var(--text);margin-bottom:4px;}
  .pedido-linha .ic{width:18px;flex-shrink:0;}
  .pedido-valor{font-size:1.1rem;font-weight:700;color:var(--green2);margin-top:8px;}
  .vazio{text-align:center;color:var(--muted);padding:40px 12px;font-size:0.9rem;}
  .toast{position:fixed;bottom:78px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);padding:10px 18px;border-radius:8px;font-size:0.85rem;opacity:0;transition:opacity 0.25s;pointer-events:none;z-index:20;}
  .toast.show{opacity:1;}
  .toast.err{border-color:var(--accent);color:var(--accent);}
  #tela-carregando{text-align:center;color:var(--muted);padding:60px 12px;}
  .mapa{height:180px;border-radius:8px;overflow:hidden;margin-top:10px;background:var(--bg);border:1px solid var(--border);}
  .mapa-indisponivel{height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.78rem;text-align:center;padding:0 12px;}
  .leaflet-popup-content-wrapper,.leaflet-popup-tip{background:var(--card);color:var(--text);}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;}
  .modal-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px 22px;max-width:360px;width:100%;text-align:center;}
  .modal-card h3{margin:0 0 8px;font-size:1.15rem;}
  .modal-card p{color:var(--muted);font-size:0.88rem;margin:0 0 22px;}
  .check-circle{width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,0.15);border:2px solid var(--green2);color:var(--green2);font-size:1.8rem;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
  .modal-actions{display:flex;gap:10px;}
  .modal-actions button{flex:1;padding:13px;border:none;border-radius:10px;font-weight:700;font-size:0.88rem;}
  .btn-modal-nao{background:var(--card2);color:var(--text);border:1px solid var(--border) !important;}
  .btn-modal-sim{background:var(--green2);color:#06210f;}
  .modal-ocorrencia-card{text-align:left;}
  .modal-ocorrencia-card label{display:block;font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;}
  .modal-ocorrencia-card select,.modal-ocorrencia-card textarea{width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:0.9rem;margin-bottom:14px;font-family:inherit;resize:vertical;}

  .detalhe-header{display:flex;align-items:center;gap:12px;padding:4px 0 16px;}
  .detalhe-voltar{width:auto;flex:none;padding:6px 10px;background:var(--card);border:1px solid var(--border);border-radius:8px;font-size:1.1rem;}
  .detalhe-header span{font-size:1.05rem;font-weight:700;}
  .detalhe-badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;margin-bottom:14px;}
  .detalhe-badge.atribuido{background:rgba(243,156,18,0.18);color:#f39c12;}
  .detalhe-badge.em-rota{background:rgba(52,152,219,0.18);color:#3498db;}
  .detalhe-secao{margin-bottom:16px;}
  .detalhe-label{color:var(--muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;}
  .detalhe-valor{font-size:1rem;font-weight:600;}
  .detalhe-linha-tel{display:flex;align-items:center;justify-content:space-between;}
  .btn-whatsapp{width:38px;height:38px;flex:none;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:1.1rem;text-decoration:none;padding:0;}
  .detalhe-item-linha{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:0.88rem;}
  .detalhe-acoes{position:sticky;bottom:0;background:var(--bg);padding:12px 0 4px;display:flex;gap:10px;}
  .detalhe-acoes button{padding:14px;font-size:0.85rem;}
  .btn-ver-mapa{background:#2980b9;color:#fff;}

  .resumo-historico{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;justify-content:space-around;text-align:center;margin-bottom:14px;}
  .resumo-historico-item .num{font-size:1.4rem;font-weight:800;}
  .resumo-historico-item .num.verde{color:var(--green2);}
  .resumo-historico-item .lbl{font-size:0.72rem;color:var(--muted);margin-top:2px;}
  .hist-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;margin-left:6px;vertical-align:middle;}
  .hist-entregue{background:rgba(39,174,96,0.18);color:var(--green2);}
  .hist-nao-entregue{background:rgba(231,76,60,0.18);color:var(--accent);}
</style>
</head>
<body>

<header class="app-header">
  <div class="header-esquerda">
    <div class="avatar-circulo">🧑</div>
    <div>
      <div class="header-saudacao">Olá, <span id="header-nome">motoboy</span></div>
    </div>
  </div>
  <div style="display:flex;gap:8px;">
    <button class="header-sino" id="btn-sino" title="Notificações">🔔</button>
    <button id="btn-sair" onclick="sair()" style="display:none;width:auto;">Sair</button>
  </div>
</header>

<div class="container">

  <div id="tela-carregando" class="vazio">Carregando...</div>

  <!-- LOGIN -->
  <div id="tela-login" class="card" style="display:none;">
    <div class="login-logo">
      <div class="login-logo-icon">🛵</div>
      <div class="login-logo-texto">GAC<span>FOOD</span></div>
      <div class="login-logo-sub">DELIVERY</div>
    </div>
    <div class="login-subtitulo">Acesse sua conta</div>

    <div class="login-campo">
      <span class="login-icone">👤</span>
      <input id="login-usuario" autocomplete="username" placeholder="Login">
    </div>
    <div class="login-campo">
      <span class="login-icone">🔒</span>
      <input id="login-senha" type="password" autocomplete="current-password" placeholder="Senha" onkeydown="if(event.key==='Enter') fazerLogin()">
    </div>

    <label class="login-lembrar">
      <input type="checkbox" id="login-lembrar" checked> Lembrar de mim
    </label>

    <div class="erro" id="login-erro"></div>
    <button class="btn-primary" onclick="fazerLogin()" id="btn-login">ENTRAR</button>
    <div class="login-esqueceu"><a href="#" onclick="event.preventDefault();toast('Fale com o restaurante para redefinir sua senha');">Esqueceu sua senha?</a></div>
    <div class="login-versao">Versão 1.0.0</div>
  </div>

  <!-- ABA INÍCIO (dashboard + lista) -->
  <div id="aba-inicio" style="display:none;">

    <div class="resumo-pendentes">
      <div class="resumo-topo">Pedidos Pendentes</div>
      <div class="resumo-numero" id="qtd-pendentes">0</div>
      <div class="resumo-atualizado">Atualizado <span id="hora-atualizado">agora</span> <button onclick="carregarEntregas()">↻</button></div>
    </div>

    <div class="filtro-tabs">
      <button class="filtro-tab active" data-filtro="todos" onclick="filtrarPedidos('todos')">Todos</button>
      <button class="filtro-tab" data-filtro="proximos" onclick="filtrarPedidos('proximos')">Próximos</button>
      <button class="filtro-tab" data-filtro="antigos" onclick="filtrarPedidos('antigos')">Mais antigos</button>
    </div>

    <div id="lista-entregas"></div>

  </div>

  <!-- ABA HISTÓRICO -->
  <div id="aba-historico" style="display:none;">

    <div class="filtro-tabs">
      <button class="filtro-tab active" data-periodo="hoje" onclick="filtrarHistoricoPeriodo('hoje')">Hoje</button>
      <button class="filtro-tab" data-periodo="semana" onclick="filtrarHistoricoPeriodo('semana')">Semana</button>
      <button class="filtro-tab" data-periodo="mes" onclick="filtrarHistoricoPeriodo('mes')">Mês</button>
    </div>

    <div id="resumo-historico" class="resumo-historico"></div>
    <div id="historico-entregas"></div>

  </div>

  <!-- DETALHE DO PEDIDO (tela cheia) -->
  <div id="tela-detalhe-pedido" style="display:none;">
    <div class="detalhe-header">
      <button class="detalhe-voltar" onclick="fecharDetalhePedido()">←</button>
      <span id="detalhe-titulo">Pedido</span>
    </div>
    <div id="detalhe-conteudo"></div>
  </div>

</div>

<nav class="bottom-nav" id="bottom-nav" style="display:none;">
  <button class="nav-item active" data-tab="inicio" onclick="mostrarAba('inicio')"><span>🏠</span><span>Início</span></button>
  <button class="nav-item" data-tab="historico" onclick="mostrarAba('historico')"><span>🕐</span><span>Histórico</span></button>
</nav>

<!-- MODAL CONFIRMAR ENTREGA -->
<div class="modal-overlay" id="modal-confirmar" style="display:none;">
  <div class="modal-card">
    <div class="check-circle">✓</div>
    <h3>Confirmar entrega</h3>
    <p>Deseja realmente finalizar esta entrega?</p>
    <div class="modal-actions">
      <button class="btn-modal-nao" onclick="fecharModalConfirmar()">NÃO</button>
      <button class="btn-modal-sim" id="btn-modal-confirmar-sim" onclick="confirmarEntregaModalAcao()">SIM, ENTREGUEI!</button>
    </div>
  </div>
</div>

<!-- MODAL DE OCORRÊNCIA -->
<div class="modal-overlay" id="modal-ocorrencia" style="display:none;">
  <div class="modal-card modal-ocorrencia-card">
    <h3 style="text-align:center;">⚠️ Informar Ocorrência</h3>
    <label>Motivo</label>
    <select id="ocorrencia-tipo">
      <option value="CLIENTE_NAO_ATENDE">Cliente não atende</option>
      <option value="CLIENTE_PEDIU_AGUARDAR">Cliente pediu para aguardar</option>
      <option value="CLIENTE_MUDANCA_ENDERECO">Cliente solicitou mudança de endereço</option>
      <option value="ENDERECO_INCORRETO">Endereço incorreto</option>
      <option value="ENDERECO_NAO_LOCALIZADO">Endereço não localizado</option>
      <option value="CLIENTE_AUSENTE">Cliente ausente</option>
      <option value="CLIENTE_RECUSOU">Cliente recusou o pedido</option>
      <option value="CLIENTE_CANCELOU">Cliente cancelou durante a entrega</option>
      <option value="CLIENTE_SEM_DINHEIRO">Cliente sem dinheiro (pagamento em dinheiro)</option>
      <option value="PROBLEMA_PAGAMENTO">Problema no pagamento</option>
      <option value="ENTREGA_PORTARIA">Cliente solicitou entrega na portaria</option>
      <option value="CLIENTE_DESCEU_RETIRADA">Cliente desceu para retirar</option>
    </select>
    <label>Detalhe adicional (opcional)</label>
    <textarea id="ocorrencia-detalhe" placeholder="Ex: tentei ligar 3 vezes..." rows="3"></textarea>
    <div class="modal-actions">
      <button class="btn-modal-nao" onclick="fecharModalOcorrencia()">Cancelar</button>
      <button class="btn-modal-sim" id="btn-confirmar-ocorrencia" onclick="confirmarOcorrencia()">Confirmar</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL || "")};
const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || "")};
const CIDADE_PADRAO = ${JSON.stringify(process.env.GACFOOD_CIDADE_PADRAO || "")};

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
  if (!r.ok) {
    const erro = await r.text();
    console.error('RPC:', fn, 'status:', r.status, erro);
    throw new Error(erro);
  }
  return r.json();
}

function getToken() { return localStorage.getItem('motoboy_token'); }
function getNome() { return localStorage.getItem('motoboy_nome'); }

function fmt(v) {
  return (Number(v) || 0).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
}

function fmtHora(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' });
}

function mostrarTela(id) {
  ['tela-carregando','tela-login'].forEach(t => {
    const el = document.getElementById(t);
    if (el) el.style.display = (t === id ? '' : 'none');
  });

  const mostrandoApp = (id === 'app');
  document.getElementById('bottom-nav').style.display = mostrandoApp ? 'flex' : 'none';
  document.getElementById('btn-sair').style.display = mostrandoApp ? '' : 'none';

  if (id === 'tela-login' || id === 'tela-carregando') {
    document.getElementById('aba-inicio').style.display = 'none';
    document.getElementById('aba-historico').style.display = 'none';
    document.getElementById('tela-detalhe-pedido').style.display = 'none';
  }

  if (mostrandoApp || id === 'tela-detalhe-pedido') {
    iniciarEnvioGps();
  } else {
    pararEnvioGps();
  }
}

function mostrarAba(nome) {
  document.getElementById('tela-detalhe-pedido').style.display = 'none';
  document.getElementById('aba-inicio').style.display = (nome === 'inicio') ? '' : 'none';
  document.getElementById('aba-historico').style.display = (nome === 'historico') ? '' : 'none';

  document.querySelectorAll('#bottom-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === nome);
  });

  if (nome === 'historico') carregarHistorico();
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

    if (document.getElementById('login-lembrar').checked) {
      localStorage.setItem('motoboy_login_salvo', usuario);
    } else {
      localStorage.removeItem('motoboy_login_salvo');
    }

    pedirPermissaoNotificacao();
    garantirAudioContext();

    document.getElementById('login-senha').value = '';
    mostrarAba('inicio');
    await carregarEntregas();
  } catch (e) {
    erroEl.textContent = 'Erro de conexão. Tente novamente.';
    erroEl.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'ENTRAR';
  }
}

function sair() {
  localStorage.removeItem('motoboy_token');
  localStorage.removeItem('motoboy_nome');
  pararEnvioGps();
  mostrarTela('tela-login');
}

let idsPedidosConhecidos = null;

function pedirPermissaoNotificacao() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

let audioContextMotoboy = null;

function garantirAudioContext() {
  if (!audioContextMotoboy) {
    try {
      audioContextMotoboy = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioContextMotoboy = null;
    }
  }
  if (audioContextMotoboy && audioContextMotoboy.state === 'suspended') {
    audioContextMotoboy.resume().catch(() => {});
  }
  return audioContextMotoboy;
}

function tocarSomNovoPedido() {
  const ctx = garantirAudioContext();
  if (!ctx) return;
  try {
    const tocarBip = (atraso) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.0001, ctx.currentTime + atraso);
      ganho.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + atraso + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + atraso + 0.3);
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      osc.start(ctx.currentTime + atraso);
      osc.stop(ctx.currentTime + atraso + 0.32);
    };
    tocarBip(0);
    tocarBip(0.35);
  } catch (e) {
    console.warn('Som de notificação falhou:', e.message);
  }
}

function vibrarNovoPedido() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) {
    console.warn('Vibração falhou:', e.message);
  }
}

document.addEventListener('click', garantirAudioContext, { once: true });
document.addEventListener('touchstart', garantirAudioContext, { once: true });

function detectarPedidosNovos(entregas) {
  const idsAtuais = new Set(entregas.map(e => String(e.id)));

  if (idsPedidosConhecidos !== null) {
    entregas.forEach(p => {
      if (!idsPedidosConhecidos.has(String(p.id))) {
        notificarNovoPedido(p);
      }
    });
  }

  idsPedidosConhecidos = idsAtuais;
}

function notificarNovoPedido(pedido) {
  tocarSomNovoPedido();
  vibrarNovoPedido();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification('GACFOOD DELIVERY', {
      body: 'Novo pedido disponível! Você tem um novo pedido para entrega. Pedido #' + (pedido.numero_cupom ?? pedido.pedido_id_local),
    });
  } catch (e) {
    console.warn('Notificação falhou:', e.message);
  }
  toast('📦 Novo pedido #' + (pedido.numero_cupom ?? pedido.pedido_id_local));
}

if (getToken()) pedirPermissaoNotificacao();
(function preencherLoginSalvo() {
  const salvo = localStorage.getItem('motoboy_login_salvo');
  if (salvo) {
    const campo = document.getElementById('login-usuario');
    if (campo) campo.value = salvo;
  } else {
    const chk = document.getElementById('login-lembrar');
    if (chk) chk.checked = false;
  }
})();

let intervalGps = null;
let ultimaPosicaoMotoboy = null;

function iniciarEnvioGps() {
  if (intervalGps || !navigator.geolocation) return;
  const enviar = () => {
    const token = getToken();
    if (!token) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        ultimaPosicaoMotoboy = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        atualizarMarcadorMotoboyEmTodosMapas();
        try {
          await rpc('atualizar_localizacao_motoboy', {
            p_token: token,
            p_lat: pos.coords.latitude,
            p_lng: pos.coords.longitude
          });
        } catch (e) {
          console.warn('GPS não sincronizado:', e.message);
        }
      },
      (err) => console.warn('GPS indisponível:', err.message),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );
  };
  enviar();
  intervalGps = setInterval(enviar, 20000);
}

function pararEnvioGps() {
  if (intervalGps) { clearInterval(intervalGps); intervalGps = null; }
}

const cacheGeocode = {};
const mapasAtivos = {};

async function geocodificarEndereco(pedidoId, endereco, bairro) {
  if (cacheGeocode[pedidoId]) return cacheGeocode[pedidoId];
  const partes = [endereco];
  if (bairro) partes.push(bairro);
  if (CIDADE_PADRAO) partes.push(CIDADE_PADRAO);
  const query = partes.join(', ');
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query));
    const dados = await r.json();
    if (Array.isArray(dados) && dados.length > 0) {
      const ponto = { lat: parseFloat(dados[0].lat), lng: parseFloat(dados[0].lon) };
      cacheGeocode[pedidoId] = ponto;
      return ponto;
    }
  } catch (e) {
    console.warn('Geocodificação falhou:', e.message);
  }
  return null;
}

async function buscarRotaRuas(origem, destino) {
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/' +
      origem.lng + ',' + origem.lat + ';' + destino.lng + ',' + destino.lat +
      '?overview=full&geometries=geojson';
    const r = await fetch(url);
    const dados = await r.json();
    if (dados && dados.routes && dados.routes[0]) {
      return dados.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch (e) {
    console.warn('Rota pelas ruas indisponível, usando linha reta:', e.message);
  }
  return null;
}

function atualizarMarcadorMotoboyEmTodosMapas() {
  Object.values(mapasAtivos).forEach(m => {
    if (!ultimaPosicaoMotoboy || !m.map) return;
    const pos = [ultimaPosicaoMotoboy.lat, ultimaPosicaoMotoboy.lng];
    if (m.marcadorMotoboy) {
      m.marcadorMotoboy.setLatLng(pos);
    } else {
      m.marcadorMotoboy = L.marker(pos, { title: 'Você' }).addTo(m.map).bindPopup('Você');
    }
  });
}

async function renderizarMapaEntrega(pedido) {
  const container = document.getElementById('mapa-' + pedido.id);
  if (!container || typeof L === 'undefined') return;

  const destino = await geocodificarEndereco(pedido.id, pedido.endereco, pedido.bairro);
  if (!destino) {
    container.innerHTML = '<div class="mapa-indisponivel">Não foi possível localizar este endereço no mapa.</div>';
    return;
  }

  const origem = ultimaPosicaoMotoboy || destino;

  let entrada = mapasAtivos[pedido.id];
  if (!entrada) {
    container.innerHTML = '';
    const map = L.map(container, { attributionControl: false }).setView([destino.lat, destino.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.control.attribution({ prefix: false }).addAttribution('© OpenStreetMap').addTo(map);
    const marcadorDestino = L.marker([destino.lat, destino.lng], { title: pedido.cliente_nome })
      .addTo(map)
      .bindPopup(pedido.cliente_nome + '<br>' + pedido.endereco);
    entrada = { map, marcadorDestino, marcadorMotoboy: null, linha: null };
    mapasAtivos[pedido.id] = entrada;
  }

  atualizarMarcadorMotoboyEmTodosMapas();

  const pontosRota = await buscarRotaRuas(origem, destino);
  const tracado = pontosRota || [[origem.lat, origem.lng], [destino.lat, destino.lng]];

  if (entrada.linha) entrada.map.removeLayer(entrada.linha);
  entrada.linha = L.polyline(tracado, {
    color: '#22c55e',
    weight: 4,
    dashArray: pontosRota ? null : '6 8'
  }).addTo(entrada.map);

  entrada.map.fitBounds(entrada.linha.getBounds(), { padding: [24, 24] });
}

function limparTodosOsMapas() {
  Object.keys(mapasAtivos).forEach(id => {
    try { mapasAtivos[id].map.remove(); } catch (e) {}
    delete mapasAtivos[id];
  });
}

let carregandoEntregas = false;
let ultimaListaEntregas = [];
let filtroPedidosAtual = 'todos';

async function carregarEntregas() {
  if (carregandoEntregas) return;
  carregandoEntregas = true;

  const token = getToken();
  if (!token) { mostrarTela('tela-login'); carregandoEntregas = false; return; }

  try {
    const entregas = await rpc('listar_minhas_entregas', { p_token: token });
    if (!Array.isArray(entregas)) throw new Error('SESSAO_INVALIDA');

    detectarPedidosNovos(entregas);

    document.getElementById('header-nome').textContent = getNome() || 'motoboy';
    mostrarTela('app');

    ultimaListaEntregas = entregas;
    document.getElementById('qtd-pendentes').textContent = entregas.length;
    document.getElementById('hora-atualizado').textContent =
      'às ' + new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' });

    renderizarListaPedidos();

    await carregarResumoHoje();
  } catch (e) {
    console.error('Erro carregar entregas:', e);

    const mensagemErro = (e && e.message) ? String(e.message) : '';
    if (mensagemErro.indexOf('SESSAO_INVALIDA') !== -1) {
      localStorage.removeItem('motoboy_token');
      localStorage.removeItem('motoboy_nome');
      mostrarTela('tela-login');
      const erroEl = document.getElementById('login-erro');
      if (erroEl) {
        erroEl.textContent = 'Sessão expirada. Faça login novamente.';
        erroEl.style.display = 'block';
      }
    } else {
      toast('Erro ao carregar entregas', 'err');
    }
  } finally {
    carregandoEntregas = false;
  }
}

function filtrarPedidos(tipo) {
  filtroPedidosAtual = tipo;
  document.querySelectorAll('#aba-inicio .filtro-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filtro === tipo);
  });
  renderizarListaPedidos();
}

function renderizarListaPedidos() {
  const lista = document.getElementById('lista-entregas');

  limparTodosOsMapas();

  let entregas = ultimaListaEntregas.slice();

  entregas.sort((a, b) => {
    const ta = a.horario_pedido || a.criado_em || '';
    const tb = b.horario_pedido || b.criado_em || '';
    return filtroPedidosAtual === 'antigos' ? ta.localeCompare(tb) : tb.localeCompare(ta);
  });

  if (filtroPedidosAtual === 'proximos') entregas = entregas.slice(0, 3);

  if (entregas.length === 0) {
    lista.innerHTML = '<div class="vazio">📦 Nenhuma entrega pendente no momento.</div>';
    return;
  }

  lista.innerHTML = entregas.map(p => \`
    <div class="card">
      <div class="pedido-num">Pedido #\${p.numero_cupom ?? p.pedido_id_local}</div>
      <div class="pedido-cliente">\${p.cliente_nome}</div>
      <div class="pedido-linha"><span class="ic">📍</span><span>\${p.endereco}\${p.referencia ? ' — ' + p.referencia : ''}</span></div>
      <div class="pedido-linha"><span class="ic">📞</span><span>\${p.cliente_telefone || ''}</span></div>
      <div class="pedido-linha"><span class="ic">🕒</span><span>Saída: \${fmtHora(p.horario_saida)}</span></div>
      <div class="pedido-valor">\${fmt(p.valor)}</div>
      <button class="btn-ver-detalhes" onclick="abrirDetalhePedido('\${p.id}')">🔎 Ver detalhes do pedido</button>
      <div class="mapa" id="mapa-\${p.id}"><div class="mapa-indisponivel">Carregando mapa...</div></div>
      <button class="btn-deslocamento" onclick="iniciarDeslocamento('\${p.id}', this)">🛵 Iniciar deslocamento</button>
      <button class="btn-confirmar" onclick="confirmarEntrega('\${p.id}')">✅ Entreguei pedido</button>
      <button class="btn-ocorrencia" onclick="abrirModalOcorrencia('\${p.id}')">⚠️ Informar ocorrência</button>
    </div>
  \`).join('');

  entregas.forEach(p => renderizarMapaEntrega(p));
}

async function iniciarDeslocamento(entregaId, btn) {
  if (btn && btn.disabled) return;
  if (btn) btn.disabled = true;
  try {
    const resultado = await rpc('iniciar_deslocamento', { p_token: getToken(), p_entrega_id: entregaId });
    if (!resultado || !resultado.ok) {
      toast(resultado?.error || 'Erro ao iniciar deslocamento', 'err');
      if (btn) btn.disabled = false;
      return;
    }
    toast('Deslocamento iniciado');
    await carregarEntregas();
  } catch (e) {
    console.error(e);
    toast('Erro de comunicação', 'err');
    if (btn) btn.disabled = false;
  }
}

let entregaIdConfirmar = null;

function confirmarEntrega(entregaId) {
  entregaIdConfirmar = entregaId;
  const btn = document.getElementById('btn-modal-confirmar-sim');
  btn.disabled = false; btn.textContent = 'SIM, ENTREGUEI!';
  document.getElementById('modal-confirmar').style.display = 'flex';
}

function fecharModalConfirmar() {
  document.getElementById('modal-confirmar').style.display = 'none';
  entregaIdConfirmar = null;
}

async function confirmarEntregaModalAcao() {
  if (!entregaIdConfirmar) return;
  const entregaId = entregaIdConfirmar;
  const btn = document.getElementById('btn-modal-confirmar-sim');
  if (btn.disabled) return;
  btn.disabled = true; btn.textContent = 'Confirmando...';

  try {
    const resultado = await rpc('confirmar_entrega', { p_token: getToken(), p_entrega_id: entregaId });
    if (!resultado || !resultado.ok) {
      toast(resultado?.error || 'Não foi possível confirmar', 'err');
      btn.disabled = false; btn.textContent = 'SIM, ENTREGUEI!';
      return;
    }
    toast('Entrega confirmada!');
    fecharModalConfirmar();
    fecharDetalhePedido();
    carregarEntregas();
  } catch (e) {
    console.error(e);
    toast('Erro de conexão', 'err');
    btn.disabled = false; btn.textContent = 'SIM, ENTREGUEI!';
  }
}

function linkWhatsApp(telefone) {
  const digitos = (telefone || '').replace(/\\D/g, '');
  if (!digitos) return null;
  const comCodigo = digitos.length <= 11 ? '55' + digitos : digitos;
  return 'https://wa.me/' + comCodigo;
}

function abrirDetalhePedido(entregaId) {
  const p = ultimaListaEntregas.find(e => String(e.id) === String(entregaId));
  if (!p) { toast('Pedido não encontrado', 'err'); return; }

  document.getElementById('detalhe-titulo').textContent =
    'Pedido #' + (p.numero_cupom ?? p.pedido_id_local);

  const itens = Array.isArray(p.itens) ? p.itens : [];
  const pagamentos = Array.isArray(p.pagamentos) ? p.pagamentos : [];
  const emRota = !!p.horario_saida;
  const wa = linkWhatsApp(p.cliente_telefone);

  document.getElementById('detalhe-conteudo').innerHTML = \`
    <div class="detalhe-badge \${emRota ? 'em-rota' : 'atribuido'}">\${emRota ? 'EM ROTA' : 'ATRIBUÍDO'}</div>

    <div class="detalhe-secao">
      <div class="detalhe-label">Cliente</div>
      <div class="detalhe-valor">\${p.cliente_nome}</div>
    </div>

    \${p.cliente_telefone ? \`
    <div class="detalhe-secao">
      <div class="detalhe-label">Telefone</div>
      <div class="detalhe-linha-tel">
        <div class="detalhe-valor">\${p.cliente_telefone}</div>
        \${wa ? '<a class="btn-whatsapp" href="' + wa + '" target="_blank" rel="noopener">💬</a>' : ''}
      </div>
    </div>\` : ''}

    <div class="detalhe-secao">
      <div class="detalhe-label">Endereço</div>
      <div class="detalhe-valor">\${p.endereco}</div>
      \${p.bairro ? '<div style="font-size:0.85rem;color:var(--muted);">' + p.bairro + '</div>' : ''}
    </div>

    \${p.referencia ? \`
    <div class="detalhe-secao">
      <div class="detalhe-label">Referência</div>
      <div class="detalhe-valor" style="font-size:0.9rem;">\${p.referencia}</div>
    </div>\` : ''}

    <div class="detalhe-secao">
      <div class="detalhe-label">Itens do pedido</div>
      \${itens.length
        ? itens.map(i => '<div class="detalhe-item-linha"><span>' + i.quantidade + 'x ' + i.nome + (i.observacao ? ' <span style="color:var(--muted);font-size:0.78rem;">(' + i.observacao + ')</span>' : '') + '</span><span style="color:var(--green2);">' + fmt(i.subtotal) + '</span></div>').join('')
        : '<div style="color:var(--muted);font-size:0.85rem;">Itens não disponíveis para este pedido</div>'}
    </div>

    <div class="detalhe-secao">
      <div class="detalhe-label">Forma de pagamento</div>
      \${pagamentos.length
        ? pagamentos.map(pg => '<div class="detalhe-valor" style="font-size:0.9rem;">' + (pg.descricao || '--') + '</div>').join('')
        : '<div style="color:var(--muted);font-size:0.85rem;">Não informado</div>'}
    </div>

    <div class="detalhe-secao">
      <div class="detalhe-label">Valor do pedido</div>
      <div class="detalhe-valor" style="color:var(--green2);font-size:1.2rem;">\${fmt(p.valor)}</div>
    </div>

    <div class="detalhe-secao">
      <div class="detalhe-label">Horário do pedido</div>
      <div class="detalhe-valor">\${fmtHora(p.horario_pedido || p.criado_em)}</div>
    </div>

    <div class="mapa" id="mapa-detalhe-\${p.id}"><div class="mapa-indisponivel">Carregando mapa...</div></div>

    <div class="detalhe-acoes">
      <button class="btn-ver-mapa" onclick="verNoMapaDetalhe('\${p.id}')">🗺️ VER NO MAPA</button>
      \${emRota
        ? '<button class="btn-confirmar" onclick="confirmarEntrega(\\'' + p.id + '\\')">✅ ENTREGUE</button>'
        : '<button class="btn-deslocamento" onclick="iniciarDeslocamento(\\'' + p.id + '\\', this)">🛵 INICIAR DESLOCAMENTO</button>'}
    </div>

    <button class="btn-ocorrencia" style="margin-top:10px;" onclick="abrirModalOcorrencia('\${p.id}')">⚠️ Informar ocorrência</button>
  \`;

  document.getElementById('aba-inicio').style.display = 'none';
  document.getElementById('aba-historico').style.display = 'none';
  document.getElementById('tela-detalhe-pedido').style.display = 'block';
}

function fecharDetalhePedido() {
  document.getElementById('tela-detalhe-pedido').style.display = 'none';
  const abaAtiva = document.querySelector('#bottom-nav .nav-item.active');
  mostrarAba(abaAtiva ? abaAtiva.dataset.tab : 'inicio');
}

function verNoMapaDetalhe(entregaId) {
  setTimeout(() => {
    const el = document.getElementById('mapa-detalhe-' + entregaId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

let entregaIdOcorrencia = null;

function abrirModalOcorrencia(entregaId) {
  entregaIdOcorrencia = entregaId;
  document.getElementById('ocorrencia-tipo').selectedIndex = 0;
  document.getElementById('ocorrencia-detalhe').value = '';
  document.getElementById('modal-ocorrencia').style.display = 'flex';
}

function fecharModalOcorrencia() {
  document.getElementById('modal-ocorrencia').style.display = 'none';
  entregaIdOcorrencia = null;
}

async function confirmarOcorrencia() {
  if (!entregaIdOcorrencia) return;

  const tipo = document.getElementById('ocorrencia-tipo').value;
  const detalhe = document.getElementById('ocorrencia-detalhe').value.trim();
  const entregaId = entregaIdOcorrencia;

  const btn = document.getElementById('btn-confirmar-ocorrencia');
  if (btn.disabled) return;
  btn.disabled = true; btn.textContent = 'Enviando...';

  try {
    const resultado = await rpc('registrar_ocorrencia', {
      p_token: getToken(), p_entrega_id: entregaId, p_tipo: tipo, p_descricao: detalhe || null
    });

    if (!resultado?.ok) {
      toast(resultado?.error || resultado?.erro || 'Erro ao registrar ocorrência', 'err');
      btn.disabled = false; btn.textContent = 'Confirmar';
      return;
    }

    toast('Ocorrência registrada e pedido concluído');
    fecharModalOcorrencia();
    fecharDetalhePedido();
    carregarEntregas();
  } catch (e) {
    console.error(e);
    toast('Erro de comunicação', 'err');
    btn.disabled = false; btn.textContent = 'Confirmar';
  }
}

async function carregarResumoHoje() {
  const token = getToken();
  if (!token) return;
  try {
    await rpc('resumo_entregas_motoboy', { p_token: token });
  } catch (e) {
    console.warn('Erro resumo:', e.message);
  }
}

let ultimoHistoricoCompleto = [];
let periodoHistoricoAtual = 'hoje';

async function carregarHistorico() {
  const token = getToken();
  if (!token) return;
  try {
    const historico = await rpc('historico_entregas_motoboy', { p_token: token });
    ultimoHistoricoCompleto = Array.isArray(historico) ? historico : [];
    renderizarHistorico();
  } catch (e) {
    console.warn('Erro histórico:', e.message);
  }
}

function filtrarHistoricoPeriodo(periodo) {
  periodoHistoricoAtual = periodo;
  document.querySelectorAll('#aba-historico .filtro-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.periodo === periodo);
  });
  renderizarHistorico();
}

function dataDentroDoPeriodo(dataIso, periodo) {
  if (!dataIso) return false;
  const data = new Date(dataIso);
  const agora = new Date();

  if (periodo === 'hoje') {
    return data.toDateString() === agora.toDateString();
  }
  if (periodo === 'semana') {
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    return data >= seteDiasAtras;
  }
  if (periodo === 'mes') {
    return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
  }
  return true;
}

function renderizarHistorico() {
  const area = document.getElementById('historico-entregas');
  const resumo = document.getElementById('resumo-historico');
  if (!area) return;

  const lista = ultimoHistoricoCompleto.filter(e =>
    dataDentroDoPeriodo(e.horario_entrega, periodoHistoricoAtual)
  );

  if (!lista.length) {
    area.innerHTML = '<div class="vazio">Nenhuma entrega no período selecionado.</div>';
  } else {
    area.innerHTML = lista.map(e => \`
      <div class="card">
        <div class="pedido-num">Pedido #\${e.numero_cupom || e.pedido_id_local}
          <span class="hist-badge \${e.status === 'NAO_ENTREGUE' ? 'hist-nao-entregue' : 'hist-entregue'}">\${e.status === 'NAO_ENTREGUE' ? 'NÃO ENTREGUE' : 'ENTREGUE'}</span>
        </div>
        <div class="pedido-cliente">\${e.cliente_nome}</div>
        <div class="pedido-linha"><span class="ic">📍</span><span>\${e.endereco}</span></div>
        <div class="pedido-linha"><span class="ic">💰</span><span>Valor: \${fmt(e.valor)}</span></div>
        <div class="pedido-linha"><span class="ic">🕒</span><span>\${e.status === 'NAO_ENTREGUE' ? 'Concluído' : 'Entregue'}: \${fmtHora(e.horario_entrega)}</span></div>
      </div>
    \`).join('');
  }

  const entregues = lista.filter(e => e.status !== 'NAO_ENTREGUE');
  const totalRecebido = entregues.reduce((soma, e) => soma + (Number(e.valor) || 0), 0);

  resumo.innerHTML = \`
    <div class="resumo-historico-item">
      <div class="num">\${lista.length}</div>
      <div class="lbl">Entregas</div>
    </div>
    <div class="resumo-historico-item">
      <div class="num verde">\${fmt(totalRecebido)}</div>
      <div class="lbl">Total recebido</div>
    </div>
  \`;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && getToken()) carregarEntregas();
});

setInterval(() => { if (getToken()) carregarEntregas(); }, 20000);

if (getToken()) { mostrarAba('inicio'); carregarEntregas(); } else { mostrarTela('tela-login'); }
</script>

</body>
</html>`);
};
