# hurp-http-server

[![npm](https://img.shields.io/npm/v/hurp-http-server.svg?style=flat-square)](https://www.npmjs.com/package/hurp-http-server)

Async module wrapper for native Node.js http.Server with graceful shutdown.

> More about Hurp and how to use it:  
> https://github.com/yaroslav-korotaev/hurp

## Installation

```bash
$ npm install hurp-http-server
```

## Usage

### In a Hurp-Based Application

```typescript
import Hurp from 'hurp';
import HttpServer from 'hurp-http-server';
import { Log } from 'hurp-types';

export interface Options {
  log: Log;
}

export default class App extends Hurp {
  public readonly server: HttpServer;
  
  constructor(options: Options) {
    super();
    
    const server = new HttpServer({
      log: options.log,
      handler: (req, res) => res.end('hello, world'),
      listen: {
        host: 'localhost',
        port: 3000,
      },
    });
    this.server = this.use(server);
  }
}
```

### Standalone

```typescript
import pino from 'pino';
import HttpServer from 'hurp-http-server';

async function main() {
  const log = pino();
  
  const server = new HttpServer({
    log,
    handler: (req, res) => res.end('hello, world'),
    listen: {
      host: 'localhost',
      port: 3000,
    },
  });
  
  // Start listening
  await server.init();
  
  // Shutdown gracefully
  // await server.destroy();
}
```

### Logger

Logger instance must be compatible with that interface:

```typescript
interface Log {
  child(bindings: { [key: string]: any }): Log;
  info(message: string): void;
}
```

This approach is inspired by [Bunyan](https://github.com/trentm/node-bunyan). You can use a compatible logger like [pino](https://github.com/pinojs/pino) directly or write a simple wrapper around any other you like.

## Types

### `Options`

```typescript
import { Options } from 'hurp-http-server';
```

An object, `HttpServer` constructor options.

#### `tag?: string`

Will be used as module tag and passed as `tag` field in bindings to child logger. Optional, value `http-server` used by default.

#### `log: Log`

Base logger used to create child logger for new `HttpServer` instance.

#### `server?: http.Server`

Optional native Node.js http server instance. If undefined, a new one will be created by default.

#### `handler: (req: http.IncomingMessage, res: http.ServerResponse) => void`

Request handler, will be attached to wrapped native http server instance as `request` event listener.

#### `listen?: net.ListenOptions`

Options will be passed to `listen()` method of http server instance.

## API

### `HttpServer`

```typescript
import HttpServer from 'hurp-http-server';
```

A class, async module wrapper for native Node.js http server.

#### `constructor(options: Options)`

Creates a new `HttpServer` instance.

`options: Options` - instance options  

#### `async init(): Promise<void>`

Initializes the http server by opening a port. Will throw an error in a case with `error` event from underlying native http server instance.

#### `async destroy(): Promise<void>`

Closes listening port and waits for pending requests. All keep-alived connections with no pending requsts will be closed immediately.
