export const jsGpsMotoboy = `


let intervalGps = null;
let ultimaPosicaoMotoboy = null;


function iniciarEnvioGps(){


  if(
    intervalGps ||
    !navigator.geolocation
  ){

    return;

  }



  const enviar = ()=>{


    const token =
      getToken();



    if(!token)
      return;



    navigator.geolocation.getCurrentPosition(

      async (pos)=>{


        ultimaPosicaoMotoboy = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        atualizarMarcadorMotoboyEmTodosMapas();


        try{


          await rpc(
            'atualizar_localizacao_motoboy',
            {
              p_token: token,
              p_lat: pos.coords.latitude,
              p_lng: pos.coords.longitude
            }
          );


        }catch(e){


          console.warn(
            'GPS não sincronizado:',
            e.message
          );


        }


      },


      (err)=>{


        console.warn(
          'GPS indisponível:',
          err.message
        );


      },


      {
        enableHighAccuracy:true,
        timeout:30000,
        maximumAge:10000
      }

    );


  };



  enviar();



  intervalGps =
    setInterval(
      enviar,
      20000
    );


}




function pararEnvioGps(){


  if(intervalGps){


    clearInterval(
      intervalGps
    );


    intervalGps = null;


  }


}




`;
