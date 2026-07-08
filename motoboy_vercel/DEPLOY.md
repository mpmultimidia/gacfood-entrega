# GACFOOD Motoboy — projeto standalone

App do motoboy, publicado separado do servidor local (`C:\GACFOOD\servidor`),
porque o motoboy está na rua, fora da rede Wi-Fi do restaurante. Depois de
carregado, esta página só fala com o Supabase (nunca com o servidor local) —
é só uma função serverless que devolve HTML/CSS/JS estático.

## Deploy

1. Suba esta pasta pro repositório Git do projeto Vercel que você já criou
   (ou rode `vercel` direto nesta pasta com a Vercel CLI, se preferir sem Git).
2. No painel da Vercel → **Project Settings → Environment Variables**, adicione:
   - `SUPABASE_URL` — a URL do seu projeto Supabase (ex: `https://xxxx.supabase.co`)
   - `SUPABASE_PUBLISHABLE_KEY` — a **anon key** (não a service_role!) do Supabase.
     É segura de expor no navegador — é pra isso que ela existe — mas nunca
     coloque a `service_role` key aqui.
3. Marque essas variáveis pra rodar em **Production** (e Preview, se quiser
   testar em branches).
4. Faça o deploy (push no Git, ou `vercel --prod`).
5. Acesse a URL que a Vercel te der (ex: `https://gacfood-motoboy.vercel.app`)
   — essa é a URL fixa que o motoboy vai abrir no celular, de qualquer lugar,
   sem precisar estar na rede do restaurante.

## Depois de publicado

- Recomendo o motoboy **adicionar a página à tela inicial do celular**
  (no navegador: menu → "Adicionar à tela inicial") — fica com cara de app,
  abre em tela cheia, sem barra de endereço.
- Teste pedindo pra ele fazer login, deixar o app aberto e verificar se o
  navegador pediu permissão de localização (precisa aceitar pro motor de
  prioridade funcionar).

## Rotas usadas neste projeto

Este app só chama estas RPCs do Supabase (todas via `anon key`):
- `login_motoboy`
- `listar_minhas_entregas`
- `confirmar_entrega`
- `atualizar_localizacao_motoboy`

Nenhuma delas precisa de alteração pra este deploy funcionar — só as
variáveis de ambiente acima.
