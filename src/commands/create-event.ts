'use strict';

import {Client} from 'discord.js';
import Command from '../base/command.js';
import ApiClient from '../api/api-client';
import CreateEventDialog from '../dialogs/create-event.js';

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

    return CreateEventDialog.start(message, guild.guild);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
