'use strict';
const {client, guild} = require('./redisManager');
const axios = require('axios').default;
const endpoint = process.env.API_ENDPOINT;

class Prefix {
  constructor() {
    this.client = client;
    this.db = guild;
    this.defaultPrefix = '!';
  }

  // Get the prefix for the server from DB and store it into the redis cache
  async get(key) {
    if (key == undefined) {
      return this.defaultPrefix;
    }

    let prefix = await this.client.get(key, this.db);
    if (prefix == null) {
      // Lettura del prefix dal db
      try {
        const res = await axios.get(`${endpoint}getGuild`, {
          params: {
            guild: key,
          },
        });
        if (res.status === 200) {
          prefix = res.guild.prefix;
        } else {
          prefix = this.defaultPrefix;
        }
      } catch (err) {
        console.log(err);
      }
    }
    // Set nella cache
    await this.client.set(key, prefix, this.db);

    return prefix;
  }

  // Save the prefix into the DB and update the cache
  async set(key, value) {
    // Salva il prefix nel db
    try {
      const res = await axios.post(`${endpoint}setGuild`, {guild: key, prefix: value});
      if (res.status === 200) {
        // Aggiorna il prefix nella cache
        return this.client.set(key, value, this.db);
      }
    } catch (err) {
      console.log(err);
    }

    return false;
  }
}

const prefix = new Prefix();

module.exports = prefix;
