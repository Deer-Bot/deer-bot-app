'use strict';

import {Client} from 'discord.js';
import Command from '../base/command';
import ApiClient from '../api/api-client';
import CreateEventDialog from '../dialogs/create-event';
import MessageDecorator from '../common/message-decorator';

export default class CreateEventCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'create',
      permissions: ['ADMINISTRATOR'],
      guildOnly: true,
      usage: 'create',
    });
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    const {guild} = await ApiClient.get('getGuild', {guildId: message.guild.id});
    if (guild == null || guild.channelId == undefined) {
      return message.reply(MessageDecorator.commandError('You must set a default channel before creating an event, use the `channel` command.'));
    }

    return CreateEventDialog.start(message, guild.guildId);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
