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
  .pedido-valor{font-size:1.1rem;font-weight:700;color:var(--green);margin-top:8px;}
  .vazio{text-align:center;color:var(--muted);padding:40px 12px;font-size:0.9rem;}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);padding:10px 18px;border-radius:8px;font-size:0.85rem;opacity:0;transition:opacity 0.25s;pointer-events:none;z-index:20;}
  .toast.show{opacity:1;}
  .toast.err{border-color:var(--accent);color:var(--accent);}
  #tela-carregando{text-align:center;color:var(--muted);padding:60px 12px;}
  .mapa{height:180px;border-radius:8px;overflow:hidden;margin-top:10px;background:var(--bg);border:1px solid var(--border);}
  .mapa-indisponivel{height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.78rem;text-align:center;padding:0 12px;}
  .leaflet-popup-content-wrapper,.leaflet-popup-tip{background:var(--card);color:var(--text);}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;}
  .modal-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;max-width:420px;width:100%;}
  .modal-card h3{margin:0 0 14px;font-size:1rem;}
  .modal-card label{display:block;font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;}
  .modal-card select,.modal-card textarea{width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:0.9rem;margin-bottom:14px;font-family:inherit;resize:vertical;}
  .modal-actions{display:flex;gap:10px;}
  .modal-actions button{width:auto;flex:1;padding:12px;}
  .btn-secondary{background:transparent;color:var(--muted);border:1px solid var(--border);}
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
  .hist-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;margin-left:6px;vertical-align:middle;}
  .hist-entregue{background:rgba(39,174,96,0.18);color:var(--green);}
  .hist-nao-entregue{background:rgba(231,76,60,0.18);color:var(--accent);}
</style>
</head>
<body>

<header>
  <h1 id="titulo-app">🛵 GACFOOD Motoboy</h1>
  <button id="btn-sair" onclick="sair()" style="display:none;">Sair</button>
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

  <!-- ENTREGAS -->
  <div id="tela-entregas" style="display:none;">
    <div id="resumo-entregas"></div>
    <div id="lista-entregas"></div>
    <div class="card" style="margin-bottom:8px;">
      <div class="pedido-num" style="margin-bottom:10px;">📜 Filtrar histórico por período</div>
      <label>Data inicial</label>
      <input type="date" id="hist-data-inicio">
      <label>Data final</label>
      <input type="date" id="hist-data-fim">
      <div style="display:flex;gap:10px;">
        <button class="btn-primary" style="flex:1;" onclick="filtrarHistorico()">Filtrar</button>
        <button class="btn-secondary" style="flex:1;" onclick="limparFiltroHistorico()">Limpar</button>
      </div>
    </div>
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

<!-- MODAL DE OCORRÊNCIA -->
<div class="modal-overlay" id="modal-ocorrencia" style="display:none;">
  <div class="modal-card">
    <h3>⚠️ Informar Ocorrência</h3>
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
      <button class="btn-secondary" onclick="fecharModalOcorrencia()">Cancelar</button>
      <button class="btn-ocorrencia" id="btn-confirmar-ocorrencia" onclick="confirmarOcorrencia()">Confirmar</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL || "")};
const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || "")};
const CIDADE_PADRAO = ${JSON.stringify(process.env.GACFOOD_CIDADE_PADRAO || "")};

// ─── Utilitários ────────────────────────────────────────────────────────
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
  ['tela-carregando','tela-login','tela-entregas','tela-detalhe-pedido'].forEach(t => {
    const el = document.getElementById(t);
    if (el) el.style.display = (t === id ? '' : 'none');
  });
  const sair = document.getElementById('btn-sair');
  const telaComSair = (id === 'tela-entregas' || id === 'tela-detalhe-pedido');
  if (sair) sair.style.display = telaComSair ? '' : 'none';
  if (telaComSair) iniciarEnvioGps(); else pararEnvioGps();
}

// ─── Login ──────────────────────────────────────────────────────────────
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

// ─── Notificações de novo pedido (só enquanto o app está aberto) ────────
// Usa a Notification API direto do navegador — sem service worker, então
// só funciona com o app/aba aberto (não aparece com o celular bloqueado).
let idsPedidosConhecidos = null; // null = ainda não estabelecemos a base

function pedirPermissaoNotificacao() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

// ─── Som de novo pedido ──────────────────────────────────────────────────
// Gerado na hora via Web Audio API (dois bipes) — não depende de nenhum
// arquivo de áudio hospedado. Navegadores mobile só deixam o som tocar
// depois de algum toque do usuário na página (não pode ser automático) —
// por isso o AudioContext" é criado/retomado no clique de login, e também
// no primeiro toque em qualquer lugar da tela, como reforço para quando a
// sessão já estava salva e carregarEntregas() roda sozinho, sem um clique
// de login.
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

// Reforço: no primeiro toque em qualquer lugar da tela, tenta destravar o
// áudio — cobre o caso de abrir o app já logado (sem passar pelo clique de
// "Entrar"), que é quando a maioria dos navegadores mobile bloqueia o som.
document.addEventListener('click', garantirAudioContext, { once: true });
document.addEventListener('touchstart', garantirAudioContext, { once: true });

function detectarPedidosNovos(entregas) {
  const idsAtuais = new Set(entregas.map(e => String(e.id)));

  // Na primeira carga só estabelece a base (não notifica pedidos que já
  // estavam atribuídos antes do app abrir).
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

// Se a sessão já estava salva (não precisou logar de novo agora), ainda
// assim tenta habilitar notificação — em muitos navegadores mobile isso
// funciona mesmo fora de um clique direto do usuário.
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

// ─── GPS ────────────────────────────────────────────────────────────────
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

// ─── Mapa de rota (Leaflet + Nominatim + OSRM, sem chave de API) ────────
const cacheGeocode = {};
const mapasAtivos = {};

async function geocodificarEndereco(pedidoId, endereco, bairro) {
  if (cacheGeocode[pedidoId]) return cacheGeocode[pedidoId];
  // Inclui o bairro na busca — evita confundir ruas de mesmo nome em
  // bairros/cidades diferentes (é o mesmo cuidado tomado no servidor local).
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
    color: '#e94560',
    weight: 4,
    dashArray: pontosRota ? null : '6 8'
  }).addTo(entrada.map);

  entrada.map.fitBounds(entrada.linha.getBounds(), { padding: [24, 24] });
}

function limparMapasRemovidos(idsAtivos) {
  Object.keys(mapasAtivos).forEach(id => {
    if (idsAtivos.includes(id)) return;
    try { mapasAtivos[id].map.remove(); } catch (e) {}
    delete mapasAtivos[id];
  });
}

function limparTodosOsMapas() {
  Object.keys(mapasAtivos).forEach(id => {
    try { mapasAtivos[id].map.remove(); } catch (e) {}
    delete mapasAtivos[id];
  });
}

// ─── Lista de entregas ───────────────────────────────────────────────────
let carregandoEntregas = false;
let ultimaListaEntregas = [];

async function carregarEntregas() {
  // Trava simples: se já existe um carregarEntregas() em andamento (ex: o
  // recarregamento automático de 20s coincidindo com um clique manual em
  // "Iniciar deslocamento"), ignora essa chamada nova em vez de deixar as
  // duas mexerem no mapa ao mesmo tempo — era isso que fazia o mapa ficar
  // em branco às vezes.
  if (carregandoEntregas) return;
  carregandoEntregas = true;

  const token = getToken();
  if (!token) { mostrarTela('tela-login'); carregandoEntregas = false; return; }

  try {
    const entregas = await rpc('listar_minhas_entregas', { p_token: token });
    if (!Array.isArray(entregas)) throw new Error('SESSAO_INVALIDA');

    detectarPedidosNovos(entregas);

    document.querySelector('header h1').textContent = '🛵 Olá, ' + (getNome() || 'motoboy');
    mostrarTela('tela-entregas');

    const lista = document.getElementById('lista-entregas');

    // Os <div> de mapa antigos vão ser destruídos agora que o innerHTML é
    // reescrito — então os mapas Leaflet presos a eles também precisam ser
    // encerrados aqui, senão ficam "órfãos" e o mapa novo aparece vazio
    // depois de um recarregamento (era por isso que sumia depois de 20s).
    limparTodosOsMapas();

    if (entregas.length === 0) {
      lista.innerHTML = '<div class="vazio">📦 Nenhuma entrega pendente no momento.</div>';
    } else {
      ultimaListaEntregas = entregas;
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
          <button class="btn-confirmar" onclick="confirmarEntrega('\${p.id}', this)">✅ Entreguei pedido</button>
          <button class="btn-ocorrencia" onclick="abrirModalOcorrencia('\${p.id}')">⚠️ Informar ocorrência</button>
        </div>
      \`).join('');

      entregas.forEach(p => renderizarMapaEntrega(p));
    }

    await carregarResumoHoje();
    await carregarHistorico();
  } catch (e) {
    console.error('Erro carregar entregas:', e);
    toast('Erro ao carregar entregas', 'err');
  } finally {
    carregandoEntregas = false;
  }
}

async function iniciarDeslocamento(entregaId, btn) {
  if (btn.disabled) return; // trava contra clique duplo
  btn.disabled = true;
  try {
    const resultado = await rpc('iniciar_deslocamento', { p_token: getToken(), p_entrega_id: entregaId });
    if (!resultado || !resultado.ok) {
      toast(resultado?.error || 'Erro ao iniciar deslocamento', 'err');
      btn.disabled = false;
      return;
    }
    toast('Deslocamento iniciado');
    carregarEntregas();
  } catch (e) {
    console.error(e);
    toast('Erro de comunicação', 'err');
    btn.disabled = false;
  }
}

async function confirmarEntrega(entregaId, btn) {
  if (btn.disabled) return; // trava contra clique duplo
  if (!confirm('Confirmar entrega realizada?')) return;
  btn.disabled = true;
  try {
    const resultado = await rpc('confirmar_entrega', { p_token: getToken(), p_entrega_id: entregaId });
    if (!resultado || !resultado.ok) {
      toast(resultado?.error || 'Não foi possível confirmar', 'err');
      btn.disabled = false;
      return;
    }
    toast('Entrega confirmada!');
    carregarEntregas();
  } catch (e) {
    console.error(e);
    toast('Erro de conexão', 'err');
    btn.disabled = false;
  }
}

function linkWhatsApp(telefone) {
  const digitos = (telefone || '').replace(/\D/g, '');
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
        ? itens.map(i => '<div class="detalhe-item-linha"><span>' + i.quantidade + 'x ' + i.nome + (i.observacao ? ' <span style="color:var(--muted);font-size:0.78rem;">(' + i.observacao + ')</span>' : '') + '</span><span style="color:var(--green);">' + fmt(i.subtotal) + '</span></div>').join('')
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
      <div class="detalhe-valor" style="color:var(--green);font-size:1.2rem;">\${fmt(p.valor)}</div>
    </div>

    <div class="detalhe-secao">
      <div class="detalhe-label">Horário do pedido</div>
      <div class="detalhe-valor">\${fmtHora(p.horario_pedido || p.criado_em)}</div>
    </div>

    <div class="detalhe-acoes">
      <button class="btn-ver-mapa" onclick="verNoMapaDetalhe('\${p.id}')">🗺️ VER NO MAPA</button>
      \${emRota
        ? '<button class="btn-confirmar" onclick="confirmarEntrega(\\'' + p.id + '\\', this)">✅ ENTREGUE</button>'
        : '<button class="btn-deslocamento" onclick="iniciarDeslocamento(\\'' + p.id + '\\', this)">🛵 INICIAR DESLOCAMENTO</button>'}
    </div>

    <button class="btn-ocorrencia" style="margin-top:10px;" onclick="abrirModalOcorrencia('\${p.id}')">⚠️ Informar ocorrência</button>
  \`;

  mostrarTela('tela-detalhe-pedido');
}

function fecharDetalhePedido() {
  mostrarTela('tela-entregas');
}

function verNoMapaDetalhe(entregaId) {
  fecharDetalhePedido();
  setTimeout(() => {
    const el = document.getElementById('mapa-' + entregaId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);
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
  if (btn.disabled) return; // trava contra clique duplo
  btn.disabled = true; btn.textContent = 'Enviando...';

  try {
    // A própria função no Supabase já marca o pedido como NAO_ENTREGUE
    // (separado de ENTREGUE, pra não misturar nos relatórios) — não
    // precisa mais chamar confirmar_entrega depois.
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

// ─── Resumo de desempenho e histórico ────────────────────────────────────
async function carregarResumoHoje() {
  const token = getToken();
  if (!token) return;
  try {
    const resumo = await rpc('resumo_entregas_motoboy', { p_token: token });
    const area = document.getElementById('resumo-entregas');
    if (!area || !resumo) return;
    area.innerHTML = \`
      <div class="card">
        <div class="pedido-num">📊 Desempenho de hoje</div>
        <div class="pedido-linha"><span class="ic">📦</span><span>Entregas realizadas: \${resumo.entregas_realizadas || 0}</span></div>
        <div class="pedido-linha"><span class="ic">💰</span><span>Valor entregue: \${fmt(resumo.valor_total || 0)}</span></div>
        <div class="pedido-linha"><span class="ic">⏱️</span><span>Tempo médio: \${resumo.tempo_medio || '--'}</span></div>
        <div class="pedido-linha"><span class="ic">🛵</span><span>Última entrega: \${resumo.ultima_entrega ? fmtHora(resumo.ultima_entrega) : '--'}</span></div>
      </div>
    \`;
  } catch (e) {
    console.warn('Erro resumo:', e.message);
  }
}

let ultimoHistoricoCompleto = [];

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

function renderizarHistorico() {
  const area = document.getElementById('historico-entregas');
  if (!area) return;

  const dataInicio = document.getElementById('hist-data-inicio')?.value;
  const dataFim = document.getElementById('hist-data-fim')?.value;

  let lista = ultimoHistoricoCompleto;

  // Filtro por período — compara só a parte de data (YYYY-MM-DD) do
  // horario_entrega, ignorando hora.
  if (dataInicio || dataFim) {
    lista = lista.filter(e => {
      if (!e.horario_entrega) return false;
      const dataEntrega = e.horario_entrega.slice(0, 10);
      if (dataInicio && dataEntrega < dataInicio) return false;
      if (dataFim && dataEntrega > dataFim) return false;
      return true;
    });
  }

  if (!lista.length) {
    area.innerHTML = '<div class="vazio">Nenhuma entrega ' + ((dataInicio || dataFim) ? 'no período selecionado.' : 'realizada.') + '</div>';
    return;
  }

  area.innerHTML = lista.map(e => \`
    <div class="card">
      <div class="pedido-num">Pedido #\${e.numero_cupom || e.pedido_id_local}
        <span class="hist-badge \${e.status === 'NAO_ENTREGUE' ? 'hist-nao-entregue' : 'hist-entregue'}">\${e.status === 'NAO_ENTREGUE' ? 'NÃO ENTREGUE' : 'ENTREGUE'}</span>
      </div>
      <div class="pedido-cliente">\${e.cliente_nome}</div>
      <div class="pedido-linha"><span class="ic">📍</span><span>\${e.endereco}</span></div>
      <div class="pedido-linha"><span class="ic">📞</span><span>\${e.cliente_telefone || ''}</span></div>
      <div class="pedido-linha"><span class="ic">💰</span><span>Valor: \${fmt(e.valor)}</span></div>
      <div class="pedido-linha"><span class="ic">🕒</span><span>\${e.status === 'NAO_ENTREGUE' ? 'Concluído' : 'Entregue'}: \${fmtHora(e.horario_entrega)}</span></div>
    </div>
  \`).join('');
}

function filtrarHistorico() {
  renderizarHistorico();
}

function limparFiltroHistorico() {
  document.getElementById('hist-data-inicio').value = '';
  document.getElementById('hist-data-fim').value = '';
  renderizarHistorico();
}

// ─── Boot ─────────────────────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && getToken()) carregarEntregas();
});

setInterval(() => { if (getToken()) carregarEntregas(); }, 20000);

if (getToken()) carregarEntregas(); else mostrarTela('tela-login');
</script>

</body>
</html>`);
};
