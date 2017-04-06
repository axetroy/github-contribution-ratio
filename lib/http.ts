declare function GM_xmlhttpRequest(agm: any): any;

import * as extend from 'extend';

interface Response$ extends Object{
  response: string,
  readyState: number,
  responseHeaders: any,
  responseText: string,
  status: number,
  statusText: string,
  context: any,
  finalUrl: string
}

interface Options$ extends Object{
  binary?: boolean,
  context?: any,
  data?: any,
  headers?: any,
  method: string,
  onabort?(response: Response$): void
  onerror?(response: Response$): void
  onload?(): void
  onprogress?(): void
  onreadystatechange?(response: Response$): void
  ontimeout?(response: Response$): void,
  overrideMimeType?: string,
  user?: string,
  password?: string,
  synchronous: boolean,
  timeout?: number,
  upload?: any,
  url: string,
  base?: string
}

interface DefaultRequestOptions$ extends Object {
  binary?: boolean,
  context?: any,
  data?: any,
  headers?: any,
  overrideMimeType?: string,
  user?: string,
  password?: string,
  synchronous?: boolean,
  timeout?: number,
  upload?: any,
  base?: string
}

class Http {

  constructor(private options?: DefaultRequestOptions$) {
  }

  request(method: string, url: string, body: any, headers: object = {'Cookie': document.cookie}): Promise<Response$> {
    let options: Options$ = extend({}, this.options, {method, url, data: body, headers});
    if (options.url.indexOf('http') !== 0) {
      options.url = (options.base || '') + url;
    }

    options.url += '?client_id=b8257841dd7ca5eef2aa&client_secret=4da33dd6fcb0a01d395945ad18613ecf9c12079e';

    return new Promise(function (resolve, reject) {
      options.synchronous = true;   // async
      options.onreadystatechange = function (response: Response$) {
        if (response.readyState !== 4) return;
        response.status >= 200 && response.status < 400 ? resolve(response) : reject(response);
      };

      options.onerror = function (response: Response$) {
        console.error('http error');
        reject(response);
      };

      options.onabort = function (response: Response$) {
        console.error('http abort');
        reject(response);
      };

      options.ontimeout = function (response: Response$) {
        console.error('http timeout');
        reject(response);
      };

      GM_xmlhttpRequest(extend({}, options));
    });
  }

  get(url: string, body: any = null, headers: object = {}): Promise<Response$> {
    return this.request('GET', url, body, headers);
  }

  post(url: string, body: any = null, headers: object = {}): Promise<Response$> {
    return this.request('POST', url, body, headers);
  }
}

const timeout = 5000;
let http = new Http({timeout, base: 'https://api.github.com'});

export {http, Response$, timeout};