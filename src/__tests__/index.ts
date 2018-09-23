import * as net from 'net';
import * as http from 'http';
import HttpServer from '../index';
import got from 'got';

function createLog() {
  return {
    fatal() {},
    error() {},
    warn() {},
    info() {},
    debug() {},
    trace() {},
    child() {
      return createLog();
    },
  };
}

function createServer(port: number = 0, hook: () => void = () => {}) {
  const server = new HttpServer({
    log: createLog(),
    handler: (req, res) => {
      if (hook)
        hook();
      
      if (req.url == '/foo')
        return res.end('foo');
      
      if (req.url == '/delay')
        return setTimeout(() => res.end('delay'), 200);
      
      res.statusCode = 404;
      res.end();
    },
    listen: {
      host: 'localhost',
      port,
    },
  });
  
  return server;
}

function getPort(server: HttpServer) {
  const address = server.server.address() as net.AddressInfo;
  
  return address.port;
}

async function request(
  server: HttpServer,
  path: string,
  keepAlive: boolean = false,
): Promise<string> {
  const port = getPort(server);
  const agent = (keepAlive)
    ? new http.Agent({ keepAlive: true, keepAliveMsecs: 2000 })
    : undefined
  ;
  const response = await got(`http://localhost:${port}${path}`, { agent });
  
  return response.body;
};

async function delay(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

describe('HttpServer', () => {
  test('accepts requests', async () => {
    const server = createServer();
    await server.init();
    
    const res = await request(server, '/foo');
    
    expect(res).toBe('foo');
    
    await server.destroy();
  }, 1000);
  
  test('throws on init error', async () => {
    const server = createServer();
    await server.init();
    
    const anotherServer = createServer(getPort(server));
    
    await expect(anotherServer.init()).rejects.toThrow();
    
    await server.destroy();
  }, 1000);
  
  test('closing the server without connections', async () => {
    const server = createServer();
    await server.init();
    
    await server.destroy();
    
    expect(server.server.listening).toBe(false);
  }, 1000);
  
  test('waiting for pending and terminating keep alived andconnections', async () => {
    let hook;
    
    const connected = new Promise(resolve => hook = resolve);
    const server = createServer(0, hook);
    await server.init();
    
    let result = { err: null, res: null };
    let promise = request(server, '/delay', true)
      .then(res => result.res = res)
      .catch(err => result.err = err)
    ;
    
    await connected;
    await server.destroy();
    await promise;
    
    expect(server.server.listening).toBe(false);
    expect(result.err).toBe(null);
    expect(result.res).toBe('delay');
  }, 1000);
});
