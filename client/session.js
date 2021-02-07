const {client, userDB} = require('./redisManager');

class Session {
  constructor() {
    this.client = client;
    this.db = userDB;
  }

  async create(userId, value) {
    return this.client.set(userId, value, this.db);
  }

  async get(userId) {
    return this.client.get(userId, this.db);
  }

  async update(userId, value) {
    return this.client.set(userId, value, this.db);
  }
}

const session = new Session();

module.exports = session;
