import { StatusError } from "itty-router-extras"

export async function get({ request, platform }) {
  try {
    const { headers } = request
    const { env } = platform
    const { SOCKETS } = env

    if (headers.get('Upgrade') !== 'websocket')
      throw new StatusError(426, `Missing 'Upgrade: websocket' header`)

    const sockId = SOCKETS.idFromName('sockets')
    const sockStub = SOCKETS.get(sockId)
    const sockRes = await sockStub.fetch(request)

    return new Response(null, sockRes)
  } catch(err) {
    // Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
    // won't show us the response body! So... let's send a WebSocket response with an error
    // frame instead.
    const [client, server] = Object.values(new WebSocketPair())

    server.accept()
    server.send(err.stack)
    server.addEventListener('message', () => server.close(1011, 'Uncaught exception during session setup'))
    server.addEventListener('error', (event) => console.error(event))

    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }
}