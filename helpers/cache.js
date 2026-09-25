class Cache {
  constructor(ttl = 300000, max = 500) {
    this.ttl = ttl;
    this.max = max;
    this.map = new Map();
  }
  get(k) {
    const h = this.map.get(k);
    if (!h) return null;
    if (Date.now() - h.at > (h.ttl || this.ttl)) { this.map.delete(k); return null; }
    return h.data;
  }
  set(k, data, ttl) {
    if (this.map.size >= this.max) {
      const first = this.map.keys().next().value;
      this.map.delete(first);
    }
    this.map.set(k, { at: Date.now(), data, ttl: ttl || this.ttl });
  }
}
const pageCache = new Cache(parseInt(process.env.CACHE_TTL_MS || "300000", 10));
module.exports = { Cache, pageCache };
