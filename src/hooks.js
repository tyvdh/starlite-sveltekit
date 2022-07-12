import { dev } from '$app/env'
import _mf from './_mf'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { request, routeId, url } = event
  const { headers } = request
  const { pathname } = url

  event.platform = await _mf(event.platform)

  if (headers.get('upgrade') === 'websocket') {
    
    // 3000 (vite / sveltekit) doesn't support websockets so forward the request to Miniflare server
    if (
      dev
      && url.port === '3000'
    ) return new Response(null, {
      status: 307,
      headers: {
        'Location': url.href.replace(/:\d+/gi, ':3030')
      }
    })

    // Only ever called on prod??
    // const { default: { fetch }} = await import(`./lib/bindings.js`)

    // request.url = url.href

    const { ws } = await import('./connect/[id]/ws.js')

    return new Response(null, await ws(event))
    ////
  }

  return resolve(event)
}