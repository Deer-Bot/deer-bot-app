'use strict';

import {Client} from 'discord.js';
import Command from '../base/command.js';
import Prefix from '../cache/prefix';

export default class PrefixCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'prefix',
      permissions: ['ADMINISTRATOR'],
      guildOnly: true,
      usage: `prefix <new prefix>`,
      // TODO: other command options
    });
  }

  protected async run(message: EnrichedMessage, args: string[]) {
    // Salva il nuovo prefisso
    const result = await Prefix.set(message.guild.id, args[0]);
    if (result) {
      return message.reply(`your new prefix is ${args[0]}`);
    }

    return this.sendError(message);
  }

  protected checkArgs(args: string[]) {
    return args.length == 1;
  }
}