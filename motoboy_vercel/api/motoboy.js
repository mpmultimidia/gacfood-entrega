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
    <label>Usuário</label>
    <input id="login-usuario" autocomplete="username" placeholder="Seu login">
    <label>Senha</label>
    <input id="login-senha" type="password" autocomplete="current-password" placeholder="Sua senha" onkeydown="if(event.key==='Enter') fazerLogin()">
    <div class="erro" id="login-erro"></div>
    <button class="btn-primary" onclick="fazerLogin()" id="btn-login">Entrar</button>
  </div>

  <!-- ENTREGAS -->
  <div id="tela-entregas" style="display:none;">
    <div id="resumo-entregas"></div>
    <div id="lista-entregas"></div>
    <div id="historico-entregas"></div>
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
  ['tela-carregando','tela-login','tela-entregas'].forEach(t => {
    const el = document.getElementById(t);
    if (el) el.style.display = (t === id ? '' : 'none');
  });
  const sair = document.getElementById('btn-sair');
  if (sair) sair.style.display = (id === 'tela-entregas') ? '' : 'none';
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
  pararEnvioGps();
  mostrarTela('tela-login');
}

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
async function carregarEntregas() {
  const token = getToken();
  if (!token) { mostrarTela('tela-login'); return; }

  try {
    const entregas = await rpc('listar_minhas_entregas', { p_token: token });
    if (!Array.isArray(entregas)) throw new Error('SESSAO_INVALIDA');

    document.querySelector('header h1').textContent = '🛵 Olá, ' + (getNome() || 'motoboy');
    mostrarTela('tela-entregas');
    iniciarEnvioGps();

    const lista = document.getElementById('lista-entregas');

    // Os <div> de mapa antigos vão ser destruídos agora que o innerHTML é
    // reescrito — então os mapas Leaflet presos a eles também precisam ser
    // encerrados aqui, senão ficam "órfãos" e o mapa novo aparece vazio
    // depois de um recarregamento (era por isso que sumia depois de 20s).
    limparTodosOsMapas();

    if (entregas.length === 0) {
      lista.innerHTML = '<div class="vazio">📦 Nenhuma entrega pendente no momento.</div>';
    } else {
      lista.innerHTML = entregas.map(p => \`
        <div class="card">
          <div class="pedido-num">Pedido #\${p.numero_cupom ?? p.pedido_id_local}</div>
          <div class="pedido-cliente">\${p.cliente_nome}</div>
          <div class="pedido-linha"><span class="ic">📍</span><span>\${p.endereco}\${p.referencia ? ' — ' + p.referencia : ''}</span></div>
          <div class="pedido-linha"><span class="ic">📞</span><span>\${p.cliente_telefone || ''}</span></div>
          <div class="pedido-linha"><span class="ic">🕒</span><span>Saída: \${fmtHora(p.horario_saida)}</span></div>
          <div class="pedido-valor">\${fmt(p.valor)}</div>
          <div class="mapa" id="mapa-\${p.id}"><div class="mapa-indisponivel">Carregando mapa...</div></div>
          <button class="btn-deslocamento" onclick="iniciarDeslocamento('\${p.id}', this)">🛵 Iniciar deslocamento</button>
          <button class="btn-confirmar" onclick="confirmarEntrega('\${p.id}', this)">✅ Entreguei pedido</button>
          <button class="btn-ocorrencia" onclick="registrarOcorrencia('\${p.id}')">⚠️ Informar ocorrência</button>
        </div>
      \`).join('');

      entregas.forEach(p => renderizarMapaEntrega(p));
    }

    await carregarResumoHoje();
    await carregarHistorico();
  } catch (e) {
    console.error('Erro carregar entregas:', e);
    toast('Erro ao carregar entregas', 'err');
  }
}

async function iniciarDeslocamento(entregaId, btn) {
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

async function registrarOcorrencia(entregaId) {
  const motivo = prompt('Informe a ocorrência:');
  if (!motivo) return;
  try {
    const resultado = await rpc('registrar_ocorrencia', {
      p_token: getToken(), p_entrega_id: entregaId, p_tipo: 'OUTRO', p_descricao: motivo
    });
    if (resultado?.ok) {
      toast('Ocorrência registrada');
      carregarEntregas();
    } else {
      toast(resultado?.error || resultado?.erro || 'Erro ao registrar ocorrência', 'err');
    }
  } catch (e) {
    console.error(e);
    toast('Erro de comunicação', 'err');
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

async function carregarHistorico() {
  const token = getToken();
  if (!token) return;
  try {
    const historico = await rpc('historico_entregas_motoboy', { p_token: token });
    const area = document.getElementById('historico-entregas');
    if (!area) return;

    if (!Array.isArray(historico) || historico.length === 0) {
      area.innerHTML = '<div class="vazio">Nenhuma entrega realizada.</div>';
      return;
    }

    area.innerHTML = historico.map(e => \`
      <div class="card">
        <div class="pedido-num">Pedido #\${e.numero_cupom || e.pedido_id_local}</div>
        <div class="pedido-cliente">\${e.cliente_nome}</div>
        <div class="pedido-linha"><span class="ic">📍</span><span>\${e.endereco}</span></div>
        <div class="pedido-linha"><span class="ic">📞</span><span>\${e.cliente_telefone || ''}</span></div>
        <div class="pedido-linha"><span class="ic">💰</span><span>Valor: \${fmt(e.valor)}</span></div>
        <div class="pedido-linha"><span class="ic">🕒</span><span>Entregue: \${fmtHora(e.horario_entrega)}</span></div>
      </div>
    \`).join('');
  } catch (e) {
    console.warn('Erro histórico:', e.message);
  }
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
