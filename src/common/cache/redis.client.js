import net from 'node:net';
import tls from 'node:tls';
import { URL } from 'node:url';

function encodeCommand(parts) {
  return `*${parts.length}\r\n${parts.map((part) => `$${Buffer.byteLength(String(part))}\r\n${part}\r\n`).join('')}`;
}

function parseResponse(buffer) {
  const text = buffer.toString();
  if (text.startsWith('+')) return { value: text.slice(1).split('\r\n')[0], consumed: text.indexOf('\r\n') + 2 };
  if (text.startsWith('-')) throw new Error(text.slice(1).split('\r\n')[0]);
  if (text.startsWith(':')) return { value: Number(text.slice(1).split('\r\n')[0]), consumed: text.indexOf('\r\n') + 2 };
  if (text.startsWith('$')) {
    const end = text.indexOf('\r\n');
    const length = Number(text.slice(1, end));
    if (length < 0) return { value: null, consumed: end + 2 };
    const total = end + 2 + length + 2;
    if (Buffer.byteLength(text) < total) return null;
    return { value: text.slice(end + 2, end + 2 + length), consumed: total };
  }
  if (text.startsWith('*')) {
    const end = text.indexOf('\r\n');
    const count = Number(text.slice(1, end));
    if (count < 0) return { value: null, consumed: end + 2 };
    let offset = end + 2;
    const values = [];
    for (let i = 0; i < count; i += 1) {
      const parsed = parseResponse(Buffer.from(text.slice(offset)));
      if (!parsed) return null;
      values.push(parsed.value);
      offset += parsed.consumed;
    }
    return { value: values, consumed: offset };
  }
  return null;
}

export class RedisClient {
  constructor(redisUrl) {
    const url = new URL(redisUrl);
    this.host = url.hostname;
    this.port = Number(url.port || (url.protocol === 'rediss:' ? 6380 : 6379));
    this.secure = url.protocol === 'rediss:';
    this.password = url.password ? decodeURIComponent(url.password) : null;
    this.username = url.username ? decodeURIComponent(url.username) : null;
    this.db = url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : null;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.queue = [];
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    const socket = this.secure ? tls.connect({ host: this.host, port: this.port }) : net.createConnection({ host: this.host, port: this.port });
    this.socket = socket;

    await new Promise((resolve, reject) => {
      const onError = (error) => { cleanup(); reject(error); };
      const onConnect = () => { cleanup(); resolve(); };
      const cleanup = () => { socket.off('error', onError); socket.off('connect', onConnect); socket.off('secureConnect', onConnect); };
      socket.once('error', onError);
      socket.once('connect', onConnect);
      socket.once('secureConnect', onConnect);
    });

    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('close', () => { this.connected = false; this.rejectPending(new Error('Redis connection closed')); });
    socket.on('error', (error) => this.rejectPending(error));
    this.connected = true;

    if (this.username || this.password) await this.command(['AUTH', ...(this.username ? [this.username, this.password || ''] : [this.password])]);
    if (this.db !== null) await this.command(['SELECT', this.db]);
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.queue.length) {
      const parsed = parseResponse(this.buffer);
      if (!parsed) break;
      this.buffer = this.buffer.subarray(parsed.consumed);
      const pending = this.queue.shift();
      if (parsed.error) pending.reject(parsed.error); else pending.resolve(parsed.value);
    }
  }

  rejectPending(error) {
    while (this.queue.length) this.queue.shift().reject(error);
  }

  command(parts) {
    if (!this.socket || !this.connected) return Promise.reject(new Error('Redis is not connected'));
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.socket.write(encodeCommand(parts));
    });
  }

  async get(key) { return this.command(['GET', key]); }
  async set(key, value, ttlSeconds) {
    if (ttlSeconds) return this.command(['SET', key, value, 'EX', ttlSeconds]);
    return this.command(['SET', key, value]);
  }
  async del(keys) { return this.command(['DEL', ...(Array.isArray(keys) ? keys : [keys])]); }
  async scan(cursor, pattern) { return this.command(['SCAN', cursor, 'MATCH', pattern, 'COUNT', '100']); }
  async quit() {
    if (!this.socket || !this.connected) return;
    try { await this.command(['QUIT']); } catch { /* ignore */ }
    this.socket.end();
    this.connected = false;
  }
}
