export const cssMotoboy = `

:root{
  --bg:#0b1220;
  --card:#141b2d;
  --border:#232c42;
  --text:#e5e9f0;
  --muted:#8892a6;
  --accent:#e94560;
  --green:#27ae60;
}


*{
  box-sizing:border-box;
}


body{
  margin:0;
  font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  background:var(--bg);
  color:var(--text);
}


header{
  padding:16px;
  background:var(--card);
  border-bottom:1px solid var(--border);
  display:flex;
  justify-content:space-between;
  align-items:center;
  position:sticky;
  top:0;
  z-index:5;
}


header h1{
  font-size:1.05rem;
  margin:0;
}


#btn-sair{
  background:none;
  border:1px solid var(--border);
  color:var(--muted);
  border-radius:8px;
  padding:6px 10px;
  font-size:0.75rem;
}


.container{
  padding:16px;
  max-width:480px;
  margin:0 auto;
}


.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:12px;
  padding:16px;
  margin-bottom:12px;
}


label{
  display:block;
  font-size:0.75rem;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:.5px;
  margin-bottom:6px;
}


input{
  width:100%;
  padding:12px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:8px;
  color:var(--text);
  font-size:1rem;
  margin-bottom:14px;
}


input:focus{
  outline:none;
  border-color:var(--accent);
}


button{
  width:100%;
  padding:13px;
  border:none;
  border-radius:8px;
  font-size:.95rem;
  font-weight:700;
  cursor:pointer;
}


.btn-primary{
  background:var(--accent);
  color:#fff;
}


.btn-confirmar{
  background:var(--green);
  color:#fff;
  margin-top:10px;
}


.btn-deslocamento{
  background:#2980b9;
  color:#fff;
  margin-top:10px;
}


.btn-ocorrencia{
  background:#f39c12;
  color:#fff;
  margin-top:10px;
}


button:disabled{
  opacity:.5;
}


.erro{
  color:var(--accent);
  font-size:.82rem;
  margin-top:-8px;
  margin-bottom:12px;
  display:none;
}


.pedido-num{
  font-size:.72rem;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:1px;
}


.pedido-cliente{
  font-size:1.05rem;
  font-weight:700;
  margin:2px 0 8px;
}


.pedido-linha{
  display:flex;
  gap:8px;
  font-size:.85rem;
  color:var(--text);
  margin-bottom:4px;
}


.pedido-linha .ic{
  width:18px;
  flex-shrink:0;
}


.pedido-valor{
  font-size:1.1rem;
  font-weight:700;
  color:var(--green);
  margin-top:8px;
}


.vazio{
  text-align:center;
  color:var(--muted);
  padding:40px 12px;
  font-size:.9rem;
}


.toast{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  background:var(--card);
  border:1px solid var(--border);
  padding:10px 18px;
  border-radius:8px;
  font-size:.85rem;
  opacity:0;
  transition:.25s;
  pointer-events:none;
  z-index:20;
}


.toast.show{
  opacity:1;
}


.toast.err{
  border-color:var(--accent);
  color:var(--accent);
}


.mapa{
  height:180px;
  border-radius:8px;
  overflow:hidden;
  margin-top:10px;
  background:var(--bg);
  border:1px solid var(--border);
}


.mapa-indisponivel{
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--muted);
  font-size:.78rem;
  text-align:center;
  padding:0 12px;
}


.leaflet-popup-content-wrapper,
.leaflet-popup-tip{
  background:var(--card);
  color:var(--text);
}


`;
