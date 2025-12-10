import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS (Permite que seu site chame essa função)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, code_verifier, redirect_uri } = await req.json()
    
    // --- CREDENCIAIS SEGURAS ---
    // Como você não tem acesso ao terminal para definir secrets, 
    // estamos definindo diretamente aqui no código do servidor (Backend).
    // Este arquivo NUNCA vai para o navegador do usuário.
    const clientId = "01KC09QDGSZ5VKZQED4QJ05KJ8"
    const clientSecret = "acfb15027646927309d8818800d8500bb88af5a81881e4ea667d00b62d7752e7"

    console.log(`[Kick Auth] Trocando código para URI: ${redirect_uri}`)

    // 3. Montar requisição para a Kick
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirect_uri,
      code_verifier: code_verifier
    })

    // 4. Chamar API da Kick (Server-to-Server)
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    })

    const data = await response.json()

    if (!response.ok) {
        console.error("[Kick Auth] Erro da API:", data)
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    // 5. Retornar o Token para o seu Site
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[Kick Auth] Erro Interno:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})