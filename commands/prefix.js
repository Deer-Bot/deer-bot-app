'use strict';
const Command = require('../base/command.js');
const Prefix = require('../cache/prefix');

class PrefixCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'prefix',
      permissions: ['ADMINISTRATOR'],
      guildOnly: true,
      usage: `prefix <new prefix>`,
      // TODO: other command options
    });
  }

  async run(message, args) {
    // Salva il nuovo prefisso
    const result = await Prefix.set(message.guild.id, args[0]); // result == OK
    if (result === 'OK') {
      return message.reply(`your new prefix is ${args[0]}`);
    }

    return this.sendError(message);
  }

  checkArgs(args) {
    return args.length == 1;
  }
}

module.exports = PrefixCommand;
