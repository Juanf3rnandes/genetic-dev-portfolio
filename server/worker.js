/**
 * Backend opcional para evolução COMPARTILHADA entre todos os visitantes.
 * Cloudflare Worker + KV (plano gratuito basta).
 *
 * Deploy:
 *   1. npm i -g wrangler && wrangler login
 *   2. wrangler kv namespace create GDP_STATE   → copie o id para wrangler.toml
 *   3. wrangler deploy
 *   4. No site: VITE_GA_ENDPOINT=https://<seu-worker>.workers.dev/state npm run build
 *
 * Segurança: o estado é público e qualquer visitante pode enviá-lo — é um
 * portfólio, não um banco. O worker valida formato e tamanho e usa uma
 * verificação simples de "versão não regride" para evitar sobrescrita acidental.
 */

const ALLOWED_ORIGIN = '*'; // troque pelo domínio do portfólio em produção
const MAX_BYTES = 200_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-allow-methods': 'GET, PUT, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'content-type': 'application/json',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (url.pathname !== '/state') return new Response('{"error":"not found"}', { status: 404, headers: cors });

    if (request.method === 'GET') {
      const raw = await env.GDP_STATE.get('state');
      return new Response(raw ?? 'null', { headers: { ...cors, 'cache-control': 'no-store' } });
    }

    if (request.method === 'PUT') {
      const raw = await request.text();
      if (raw.length > MAX_BYTES) return new Response('{"error":"too large"}', { status: 413, headers: cors });
      let incoming;
      try {
        incoming = JSON.parse(raw);
      } catch {
        return new Response('{"error":"bad json"}', { status: 400, headers: cors });
      }
      if (incoming?.version !== 1 || !Array.isArray(incoming.population) || incoming.population.length !== 8) {
        return new Response('{"error":"bad shape"}', { status: 400, headers: cors });
      }
      const currentRaw = await env.GDP_STATE.get('state');
      if (currentRaw) {
        const current = JSON.parse(currentRaw);
        // só aceita estados que avançam (mais avaliações ou geração maior)
        if (incoming.generation < current.generation || (incoming.generation === current.generation && incoming.totalEvals < current.totalEvals)) {
          return new Response(currentRaw, { status: 409, headers: cors });
        }
      }
      await env.GDP_STATE.put('state', JSON.stringify(incoming));
      return new Response('{"ok":true}', { headers: cors });
    }

    return new Response('{"error":"method"}', { status: 405, headers: cors });
  },
};
