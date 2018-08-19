import * as http from 'http';
import * as net from 'net';
import { Log } from 'hurp-types';

export interface Options {
  tag?: string;
  log: Log;
  server: http.Server;
  listen?: net.ListenOptions;
}
