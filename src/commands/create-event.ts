'use strict';

import {Client} from 'discord.js';
import Command from '../base/command.js';
import Session, {UserConversation} from '../cache/session';
import ApiClient from '../api/api-client';

export default class CreateEventCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'create',
      permissions: ['ADMINISTRATOR'],
      guildOnly: true,
      usage: 'create',
      // TODO: other command options
    });
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    const {guild} = await ApiClient.get('getGuild', {guild: message.guild.id});
    if (guild == null || guild.channel == undefined) {
      return message.reply('you must set a default channel before creating an event, use `channel` command.');
    }
    const conversation: UserConversation = {
      type: 'create',
      step: 0,
      event: {
        guild: guild.guild,
        author: message.author.id,
      },
    };
    await Session.create(message.author.id, conversation);
    message.author.send('Type a name for your event');

    return message.reply('check your DMs.');
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
