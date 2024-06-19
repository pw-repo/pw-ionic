import * as util from 'util';

import chalk from 'chalk';
import * as lodash from 'lodash';
import * as superagentType from 'superagent';

import {
  APIResponse,
  APIResponseError,
  APIResponseSuccess,
  APIResponseMeta,
  APIResponsePageTokenMeta,
  HttpMethod,
  IClient,
  IConfig,
  IPaginator,
  PagePaginatorState,
  PaginateArgs,
  PaginatorGuard,
  PaginatorDeps,
  PaginatorRequestGenerator,
  ResourceClientRequestModifiers,
  TokenPaginatorState,
  Response,
  SuperAgentError,
} from '../definitions';

import { isAPIResponseError, isAPIResponseSuccess } from '../guards';
import { getGlobalProxy } from './utils/http';
import { fsReadFile } from '@ionic/cli-framework/utils/fs';
import { FatalException } from './errors';

const FORMAT_ERROR_BODY_MAX_LENGTH = 1000;
export const CONTENT_TYPE_JSON = 'application/json';

export const ERROR_UNKNOWN_CONTENT_TYPE = 'UNKNOWN_CONTENT_TYPE';
export const ERROR_UNKNOWN_RESPONSE_FORMAT = 'UNKNOWN_RESPONSE_FORMAT';

let CAS: string[] | undefined;
let CERTS: string[] | undefined;
let KEYS: string[] | undefined;

export async function createRawRequest(method: string, url: string): Promise<{ req: superagentType.SuperAgentRequest; }> {
  const superagent = await import('superagent');
  const req = superagent(method, url);

  return { req };
}

export abstract class ResourceClient {
  protected applyModifiers(req: superagentType.Request, modifiers?: ResourceClientRequestModifiers) {
    if (!modifiers) {
      return;
    }

    if (modifiers.fields) {
      req.query({ fields: modifiers.fields });
    }
  }

  protected applyAuthentication(req: superagentType.Request, token: string) {
    req.set('Authorization', `Bearer ${token}`);
  }
}

export async function createRequest(config: IConfig, method: string, url: string): Promise<{ req: superagentType.SuperAgentRequest; }> {
  const c = await config.load();
  const [ proxy, ] = getGlobalProxy();

  const { req } = await createRawRequest(method, url);

  if (proxy && req.proxy) {
    req.proxy(proxy);
  }

  if (c.ssl) {
    const conform = (p?: string | string[]): string[] => {
      if (!p) {
        return [];
      }

      if (typeof p === 'string') {
        return [p];
      }

      return p;
    };

    if (!CAS) {
      CAS = await Promise.all(conform(c.ssl.cafile).map(p => fsReadFile(p, { encoding: 'utf8' })));
    }

    if (!CERTS) {
      CERTS = await Promise.all(conform(c.ssl.certfile).map(p => fsReadFile(p, { encoding: 'utf8' })));
    }

    if (!KEYS) {
      KEYS = await Promise.all(conform(c.ssl.keyfile).map(p => fsReadFile(p, { encoding: 'utf8' })));
    }

    if (CAS.length > 0) {
      req.ca(CAS);
    }

    if (CERTS.length > 0) {
      req.cert(CERTS);
    }

    if (KEYS.length > 0) {
      req.key(KEYS);
    }
  }

  return { req };
}

export async function download(config: IConfig, url: string, ws: NodeJS.WritableStream, opts?: { progress?: (loaded: number, total: number) => void; }) {
  const { req } = await createRequest(config, 'get', url);

  const progressFn = opts ? opts.progress : undefined;

  return new Promise<void>((resolve, reject) => {
    req
      .on('response', res => {
        if (res.statusCode !== 200) {
          reject(new Error(
            `Encountered bad status code (${res.statusCode}) for ${url}\n` +
            `This could mean the server is experiencing difficulties right now--please try again later.`
          ));
        }

        if (progressFn) {
          let loaded = 0;
          const total = Number(res.headers['content-length']);
          res.on('data', chunk => {
            loaded += chunk.length;
            progressFn(loaded, total);
          });
        }
      })
      .on('error', err => {
        if (err.code === 'ECONNABORTED') {
          reject(new Error(`Timeout of ${err.timeout}ms reached for ${url}`));
        } else {
          reject(err);
        }
      })
      .on('end', resolve);

    req.pipe(ws);
  });
}

export class Client implements IClient {
  constructor(public config: IConfig) {}

  async make(method: HttpMethod, path: string): Promise<{ req: superagentType.SuperAgentRequest; }> {
    const url = path.startsWith('http://') || path.startsWith('https://') ? path : `${await this.config.getAPIUrl()}${path}`;
    const { req } = await createRequest(this.config, method, url);

    req
      .set('Content-Type', CONTENT_TYPE_JSON)
      .set('Accept', CONTENT_TYPE_JSON);

    return { req };
  }

  async do(req: superagentType.SuperAgentRequest): Promise<APIResponseSuccess> {
    const res = await req;
    const r = transformAPIResponse(res);

    if (isAPIResponseError(r)) {
      throw new FatalException('API request was successful, but the response output format was that of an error.\n'
                             + formatAPIError(req, r));
    }

    return r;
  }

  paginate<T extends Response<object[]>>(args: PaginateArgs<T>): IPaginator<T> {
    return new Paginator<T>({ client: this, ...args });
  }
}

export class Paginator<T extends Response<Object[]>> implements IPaginator<T> {
  readonly state: PagePaginatorState;
  protected client: IClient;
  protected reqgen: PaginatorRequestGenerator;
  protected guard: PaginatorGuard<T>;
  protected max?: number;

  constructor({ client, reqgen, guard, state, max }: PaginatorDeps<T, PagePaginatorState>) {
    const defaultState = { page: 1, done: false, loaded: 0 };

    this.client = client;
    this.reqgen = reqgen;
    this.guard = guard;
    this.max = max;

    if (!state) {
      state = { ...defaultState };
    }

    this.state = lodash.assign({}, state, defaultState);
  }

  next(): IteratorResult<Promise<T>> {
    if (this.state.done) {
      return { done: true } as IteratorResult<Promise<T>>; // TODO: why can't I exclude value?
    }

    return {
      done: false,
      value: (async () => {
        const { req } = await this.reqgen();

        req.query(lodash.pick(this.state, ['page', 'page_size']));

        const res = await this.client.do(req);

        if (!this.guard(res)) {
          throw createFatalAPIFormat(req, res);
        }

        this.state.loaded += res.data.length;

        if (
          res.data.length === 0 || // no resources in this page, we're done
          (typeof this.max === 'number' && this.state.loaded >= this.max) || // met or exceeded maximum requested
          (typeof this.state.page_size === 'number' && res.data.length < this.state.page_size) // number of resources less than page size, so nothing on next page
        ) {
          this.state.done = true;
        }

        this.state.page++;

        return res;
      })(),
    };
  }

  [Symbol.iterator](): this {
    return this;
  }
}

export class TokenPaginator<T extends Response<object[]>> implements IPaginator<T, TokenPaginatorState> {
  protected client: IClient;
  protected reqgen: PaginatorRequestGenerator;
  protected guard: PaginatorGuard<T>;
  protected max?: number;

  readonly state: TokenPaginatorState;

  constructor({ client, reqgen, guard, state, max }: PaginatorDeps<T, TokenPaginatorState>) {
    const defaultState = { done: false, loaded: 0 };

    this.client = client;
    this.reqgen = reqgen;
    this.guard = guard;
    this.max = max;

    if (!state) {
      state = { ...defaultState };
    }

    this.state = lodash.assign({}, state, defaultState);
  }

  next(): IteratorResult<Promise<T>> {
    if (this.state.done) {
      return { done: true } as IteratorResult<Promise<T>>; // TODO: why can't I exclude value?
    }

    return {
      done: false,
      value: (async () => {
        const { req } = await this.reqgen();

        if (this.state.page_token) {
          req.query({ page_token: this.state.page_token });
        }

        const res = await this.client.do(req);

        if (!this.isPageTokenResponseMeta(res.meta)) {
          throw createFatalAPIFormat(req, res);
        }

        const nextPageToken = res.meta.next_page_token;

        if (!this.guard(res)) {
          throw createFatalAPIFormat(req, res);
        }

        this.state.loaded += res.data.length;

        if (
          res.data.length === 0 || // no resources in this page, we're done
          (typeof this.max === 'number' && this.state.loaded >= this.max) || // met or exceeded maximum requested
          !nextPageToken // no next page token, must be done
        ) {
          this.state.done = true;
        }

        this.state.page_token = nextPageToken;

        return res;
      })(),
    };
  }

  isPageTokenResponseMeta(m: APIResponseMeta): m is APIResponsePageTokenMeta {
    const meta = <APIResponsePageTokenMeta>m;
    return meta
      && (!meta.prev_page_token || typeof meta.prev_page_token === 'string')
      && (!meta.next_page_token || typeof meta.next_page_token === 'string');
  }

  [Symbol.iterator](): this {
    return this;
  }
}

export function transformAPIResponse(r: superagentType.Response): APIResponse {
  if (r.status === 204) {
    r.body = { data: null, meta: { status: 204, version: '', request_id: '' } };
  }

  if (r.status !== 204 && r.type !== CONTENT_TYPE_JSON) {
    throw ERROR_UNKNOWN_CONTENT_TYPE;
  }

  let j = <APIResponse>r.body;

  if (!j.meta) {
    throw ERROR_UNKNOWN_RESPONSE_FORMAT;
  }

  return j;
}

export function createFatalAPIFormat(req: superagentType.SuperAgentRequest, res: APIResponse): FatalException {
  return new FatalException('API request was successful, but the response format was unrecognized.\n'
                          + formatAPIResponse(req, res));
}

export function formatSuperAgentError(e: SuperAgentError): string {
  const res = e.response;
  const req = res.request;
  const statusCode = e.response.status;

  let f = '';

  try {
    const r = transformAPIResponse(res);
    f += formatAPIResponse(req, r);
  } catch (e) {
    f += `HTTP Error ${statusCode}: ${req.method.toUpperCase()} ${req.url}\n`;
    // TODO: do this only if verbose?
    f += '\n' + (res.text ? res.text.substring(0, FORMAT_ERROR_BODY_MAX_LENGTH) : '<no buffered body>');

    if (res.text && res.text.length > FORMAT_ERROR_BODY_MAX_LENGTH) {
      f += ` ...\n\n[ truncated ${res.text.length - FORMAT_ERROR_BODY_MAX_LENGTH} characters ]`;
    }
  }

  return chalk.bold(chalk.red(f));
}

export function formatAPIResponse(req: superagentType.SuperAgentRequest, r: APIResponse) {
  if (isAPIResponseSuccess(r)) {
    return formatAPISuccess(req, r);
  } else {
    return formatAPIError(req, r);
  }
}

export function formatAPISuccess(req: superagentType.SuperAgentRequest, r: APIResponseSuccess): string {
  return `Request: ${req.method} ${req.url}\n`
    + `Response: ${r.meta.status}\n`
    + `Body: \n${util.inspect(r.data, { colors: chalk.enabled })}`;
}

export function formatAPIError(req: superagentType.SuperAgentRequest, r: APIResponseError): string {
  return `Request: ${req.method} ${req.url}\n`
    + `Response: ${r.meta.status}\n`
    + `Body: \n${util.inspect(r.error, { colors: chalk.enabled })}`;
}
