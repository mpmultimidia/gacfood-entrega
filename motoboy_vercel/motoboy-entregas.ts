export const jsEntregasMotoboy = `


async function carregarEntregas(){

  const token = getToken();


  if(!token){

    mostrarTela('tela-login');

    return;

  }


  try{


    const entregas =
      await rpc(
        'listar_minhas_entregas',
        {
          p_token: token
        }
      );



    if(!Array.isArray(entregas)){

      throw new Error(
        'SESSAO_INVALIDA'
      );

    }



    document.querySelector('header h1').textContent =
      '🛵 Olá, ' + (getNome() || 'motoboy');



    mostrarTela(
      'tela-entregas'
    );



    iniciarEnvioGps();



    const lista =
      document.getElementById(
        'lista-entregas'
      );



    if(entregas.length === 0){


      lista.innerHTML = \`

<div class="vazio">

📦 Nenhuma entrega pendente no momento.

</div>

\`;

      limparMapasRemovidos([]);



    }else{



      lista.innerHTML =
        entregas.map(
          p => \`

<div class="card">


<div class="pedido-num">

Pedido #\${p.numero_cupom ?? p.pedido_id_local}

</div>



<div class="pedido-cliente">

\${p.cliente_nome}

</div>



<div class="pedido-linha">

<span class="ic">📍</span>

<span>

\${p.endereco}

\${p.referencia ? ' — ' + p.referencia : ''}

</span>

</div>



<div class="pedido-linha">

<span class="ic">📞</span>

<span>

\${p.cliente_telefone || ''}

</span>

</div>



<div class="pedido-linha">

<span class="ic">🕒</span>

<span>

Saída:
\${fmtHora(p.horario_saida)}

</span>

</div>



<div class="pedido-valor">

\${fmt(p.valor)}

</div>



<div class="mapa" id="mapa-\${p.id}">
  <div class="mapa-indisponivel">Carregando mapa...</div>
</div>



<button

class="btn-deslocamento"

onclick="iniciarDeslocamento('\${p.id}',this)">

🛵 Iniciar deslocamento

</button>



<button

class="btn-confirmar"

onclick="confirmarEntrega('\${p.id}',this)">

✅ Entreguei pedido

</button>



<button

class="btn-ocorrencia"

onclick="registrarOcorrencia('\${p.id}')">

⚠️ Informar ocorrência

</button>



</div>

\`
        ).join('');

      limparMapasRemovidos(entregas.map(p => String(p.id)));

      entregas.forEach(p => renderizarMapaEntrega(p));

    }




    await carregarResumoHoje();
    await carregarHistorico();



  }catch(e){


    console.error(
      'Erro carregar entregas:',
      e
    );


    toast(
      'Erro ao carregar entregas',
      'err'
    );


  }


}







async function iniciarDeslocamento(
  entregaId,
  btn
){


  btn.disabled = true;



  try{


    const resultado =
      await rpc(
        'iniciar_deslocamento',
        {
          p_token:getToken(),
          p_entrega_id:entregaId
        }
      );



    if(!resultado || !resultado.ok){


      toast(
        resultado?.error ||
        'Erro ao iniciar deslocamento',
        'err'
      );


      btn.disabled=false;

      return;

    }



    toast(
      'Deslocamento iniciado'
    );



    carregarEntregas();



  }catch(e){


    console.error(e);


    toast(
      'Erro de comunicação',
      'err'
    );


    btn.disabled=false;


  }


}








async function confirmarEntrega(
  entregaId,
  btn
){


  if(
    !confirm(
      'Confirmar entrega realizada?'
    )
  )
    return;



  btn.disabled=true;



  try{


    const resultado =
      await rpc(
        'confirmar_entrega',
        {
          p_token:getToken(),
          p_entrega_id:entregaId
        }
      );



    if(!resultado || !resultado.ok){


      toast(
        resultado?.error ||
        'Não foi possível confirmar',
        'err'
      );


      btn.disabled=false;


      return;

    }



    toast(
      'Entrega confirmada!'
    );



    carregarEntregas();



  }catch(e){


    console.error(e);


    toast(
      'Erro de conexão',
      'err'
    );


    btn.disabled=false;


  }


}








async function registrarOcorrencia(
  entregaId
){


  const motivo =
    prompt(
      'Informe a ocorrência:'
    );



  if(!motivo)
    return;



  try{


    const resultado =
      await rpc(
        'registrar_ocorrencia_entrega',
        {
          p_token:getToken(),
          p_entrega_id:entregaId,
          p_observacao:motivo
        }
      );



    if(resultado?.ok){


      toast(
        'Ocorrência registrada'
      );


      carregarEntregas();



    }else{


      toast(
        resultado?.error ||
        'Erro ao registrar ocorrência',
        'err'
      );


    }



  }catch(e){


    console.error(e);


    toast(
      'Erro de comunicação',
      'err'
    );


  }


}



`;
