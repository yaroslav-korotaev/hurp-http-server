import * as net from 'net';
import * as http from 'http';
import { Log } from 'hurp-types';

interface Connection {
  socket: net.Socket;
  idle: boolean;
}

export interface Options {
  tag?: string;
  log: Log;
  server?: http.Server;
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void;
  listen?: net.ListenOptions;
}

export default class HttpServer {
  private destroyed: boolean;
  private readonly connections: Map<net.Socket, Connection>;
  
  public readonly tag: string;
  public readonly log: Log;
  public readonly server: http.Server;
  public readonly listenOptions?: net.ListenOptions;
  
  constructor(options: Options) {
    this.destroyed = false;
    this.connections = new Map();
    
    this.tag = options.tag || 'http-server';
    this.log = options.log.child({ tag: this.tag });
    
    const server = options.server || http.createServer();
    server.on('request', options.handler);
    this.server = server;
    
    this.listenOptions = options.listen;
  }
  
  private trackConnection(socket: net.Socket): void {
    const conn = { socket, idle: true };
    this.connections.set(socket, conn);
    
    socket.on('close', () => {
      this.connections.delete(socket);
    });
  }
  
  private trackRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const conn = this.connections.get(req.socket) as Connection;
    conn.idle = false;
    
    res.on('finish', () => {
      conn.idle = true;
      this.destroyConnection(conn);
    });
  }
  
  private destroyConnection(conn: Connection): void {
    if (this.destroyed && conn.idle)
      conn.socket.destroy();
  }
  
  public async init(): Promise<void> {
    const server = this.server;
    
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.listenOptions, () => {
        server.removeListener('error', reject);
        
        server.on('connection', socket => this.trackConnection(socket));
        server.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
          this.trackRequest(req, res);
        });
        
        const address = server.address();
        /* istanbul ignore next */
        const listening = (typeof address == 'object')
          ? { host: address.address, port: address.port }
          : { path: address }
        ;
        this.log.info(listening, 'listening');
        
        resolve();
      });
    });
  }
  
  public async destroy(): Promise<void> {
    await new Promise<void>(resolve => {
      this.server.once('close', resolve);
      this.server.close();
      
      this.destroyed = true;
      for (const conn of this.connections.values())
        this.destroyConnection(conn);
    });
    
    this.log.info('closed');
  }
}
