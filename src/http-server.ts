import * as net from 'net';
import * as http from 'http';
import { Log } from 'hurp-types';
import { Options } from './types';

export default class HttpServer {
  public readonly tag: string;
  public readonly log: Log;
  public readonly server: http.Server;
  public readonly listenOptions?: net.ListenOptions;
  
  constructor(options: Options) {
    this.tag = options.tag || 'http-server';
    this.log = options.log.child({ tag: this.tag });
    
    this.server = options.server;
    this.listenOptions = options.listen;
  }
  
  public async init(): Promise<void> {
    const server = this.server;
    
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.listenOptions, () => {
        server.removeListener('error', reject);
        
        const address = server.address();
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
    await new Promise(resolve => {
      this.server.once('close', resolve);
      this.server.close();
    });
    
    this.log.info('closed');
  }
}
