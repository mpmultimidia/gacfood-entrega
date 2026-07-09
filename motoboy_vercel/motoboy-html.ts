// src/paginas/motoboy/motoboy-html.ts

import { cssMotoboy } from "./motoboy-css.ts";
import { jsMotoboy } from "./motoboy-login.ts";
import { jsEntregasMotoboy } from "./motoboy-entregas.ts";
import { jsHistoricoMotoboy } from "./motoboy-historico.ts";
import { jsGpsMotoboy } from "./motoboy-gps.ts";
import { jsUtilsMotoboy } from "./motoboy-utils.ts";
import { jsMapaMotoboy } from "./motoboy-mapa.ts";

export function montarPaginaMotoboy(): string {

// Uma variável por restaurante/instalação: usada só como referência de cidade
// para a geocodificação do endereço do cliente no mapa. Se o sistema já
// guarda o endereço do restaurante em algum cadastro, pode trocar isso
// futuramente por uma consulta ao banco em vez de variável de ambiente.
const cidadePadrao = process.env.GACFOOD_CIDADE_PADRAO || "";

const jsMapaComCidade = jsMapaMotoboy.replace("__GACFOOD_CIDADE_PADRAO__", cidadePadrao);

return `
<!DOCTYPE html>
<html lang="pt-br">

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

<title>GACFOOD — Motoboy</title>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>

<style>
${cssMotoboy}
</style>

</head>

<body>


<header>

<h1 id="titulo-app">
🛵 GACFOOD Motoboy
</h1>

<button 
id="btn-sair"
onclick="sair()"
style="display:none;">
Sair
</button>

</header>



<div class="container">


<div 
id="tela-carregando"
class="vazio">

Carregando...

</div>



<div 
id="tela-login"
class="card"
style="display:none;">


<label>
Usuário
</label>


<input 
id="login-usuario"
autocomplete="username"
placeholder="Seu login">



<label>
Senha
</label>


<input 
id="login-senha"
type="password"
autocomplete="current-password"
placeholder="Sua senha"
onkeydown="if(event.key==='Enter') fazerLogin()">



<div 
class="erro"
id="login-erro">
</div>



<button 
class="btn-primary"
onclick="fazerLogin()"
id="btn-login">

Entrar

</button>


</div>





<div 
id="tela-entregas"
style="display:none;">


<div id="resumo-entregas"></div>


<div id="lista-entregas"></div>


<div id="historico-entregas"></div>


</div>




</div>




<div 
class="toast"
id="toast">

</div>




<script>

const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL || "")};

const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || "")};


${jsUtilsMotoboy}

${jsMotoboy}

${jsGpsMotoboy}

${jsMapaComCidade}

${jsEntregasMotoboy}

${jsHistoricoMotoboy}


</script>


</body>

</html>

`;

}
