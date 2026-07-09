// Mapa de rota do motoboy até o cliente.
// Usa apenas serviços gratuitos e sem chave de API:
//   - Leaflet + tiles OpenStreetMap (o mapa em si)
//   - Nominatim (geocodifica o endereço de texto em lat/lng)
//   - OSRM demo público (calcula a rota real pelas ruas)
// Se a geocodificação ou a rota falhar, cai automaticamente para uma
// linha reta entre o motoboy e o destino — o mapa nunca quebra a tela.
//
// GACFOOD_CIDADE_PADRAO: variável de ambiente, uma por restaurante/deploy.
// Serve só como "dica" pro geocodificador quando o endereço do pedido não
// tem cidade/UF (ex: "rua do matoso, 35" -> busca "rua do matoso, 35, <cidade padrão>").
export const jsMapaMotoboy = `

const CIDADE_PADRAO = ${JSON.stringify("__GACFOOD_CIDADE_PADRAO__")};

const cacheGeocode = {};
const mapasAtivos = {};

async function geocodificarEndereco(pedidoId, endereco){
  if (cacheGeocode[pedidoId]) return cacheGeocode[pedidoId];

  const query = endereco + (CIDADE_PADRAO ? (', ' + CIDADE_PADRAO) : '');

  try {
    const r = await fetch(
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query)
    );
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

async function buscarRotaRuas(origem, destino){
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/' +
      origem.lng + ',' + origem.lat + ';' + destino.lng + ',' + destino.lat +
      '?overview=full&geometries=geojson';
    const r = await fetch(url);
    const dados = await r.json();
    if (dados && dados.routes && dados.routes[0]) {
      // GeoJSON vem como [lng, lat] — Leaflet quer [lat, lng]
      return dados.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch (e) {
    console.warn('Rota pelas ruas indisponível, usando linha reta:', e.message);
  }
  return null;
}

function atualizarMarcadorMotoboyEmTodosMapas(){
  Object.values(mapasAtivos).forEach(m => {
    if (!ultimaPosicaoMotoboy || !m.map) return;
    const pos = [ultimaPosicaoMotoboy.lat, ultimaPosicaoMotoboy.lng];
    if (m.marcadorMotoboy) {
      m.marcadorMotoboy.setLatLng(pos);
    } else {
      m.marcadorMotoboy = L.marker(pos, {
        title: 'Você'
      }).addTo(m.map).bindPopup('Você');
    }
  });
}

async function renderizarMapaEntrega(pedido){
  const container = document.getElementById('mapa-' + pedido.id);
  if (!container || typeof L === 'undefined') return;

  const destino = await geocodificarEndereco(pedido.id, pedido.endereco);
  if (!destino) {
    container.innerHTML = '<div class="mapa-indisponivel">Não foi possível localizar este endereço no mapa.</div>';
    return;
  }

  const origem = ultimaPosicaoMotoboy || destino;

  let entrada = mapasAtivos[pedido.id];
  if (!entrada) {
    container.innerHTML = '';
    const map = L.map(container, { attributionControl: false }).setView([destino.lat, destino.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
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

function limparMapasRemovidos(idsAtivos){
  Object.keys(mapasAtivos).forEach(id => {
    if (idsAtivos.includes(id)) return;
    try { mapasAtivos[id].map.remove(); } catch (e) {}
    delete mapasAtivos[id];
  });
}

`;
