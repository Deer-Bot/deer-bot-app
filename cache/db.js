class RedisDb {
  constructor(index, ttl, get, set) {
    this.index = index;
    this.ttl = ttl;
    this.get = async (key) => get(key);
    this.set = async (key, value) => set(key, value);
  }
}

module.exports = RedisDb;
