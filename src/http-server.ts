import * as net from 'net';
import * as http from 'http';
import * as hurp from 'hurp';
import { Log } from 'hurp-types';
import { Options } from './types';

export default class HttpServer extends hurp.Module {
  public readonly tag: string;
  public readonly log: Log;
  public readonly server: http.Server;
  public readonly listenOptions?: net.ListenOptions;
  
  constructor(options: Options) {
    super();
    
    this.tag = options.tag || 'http-server';
    this.log = options.log.child({ tag: this.tag });
    
    this.server = options.server;
    this.listenOptions = options.listen;
  }
  
  protected async init(): Promise<void> {
    const server = this.server;
    
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.listenOptions, () => {
        server.removeListener('error', reject);
        
        server.on('error', err => this.emit('error', err));
        
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
  
  protected async destroy(): Promise<void> {
    await new Promise(resolve => {
      this.server.once('close', resolve);
      this.server.close();
    });
    
    this.log.info('closed');
  }
}
