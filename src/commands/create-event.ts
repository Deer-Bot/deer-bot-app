import {Client} from 'discord.js';
import Command from '../base/command';
import CreateEventDialog from '../dialogs/create-event';
import MessageDecorator from '../common/message-decorator';
import GuildInfoManager from '../cache/guild-info-manager';

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
    const guildInfo = await GuildInfoManager.get(message.guild.id);

    if (guildInfo == null || guildInfo.channelId == undefined || guildInfo.channelId === GuildInfoManager.unspecifiedChannel) {
      return message.reply(MessageDecorator.commandError('You must set a default channel before creating an event, use the `channel` command.'));
    }
    if (guildInfo.timezoneOffset == GuildInfoManager.invalidTimezone) {
      return message.reply(MessageDecorator.commandError('You must set a timezone before creating an event, use the `timezone` command.'));
    }

    return CreateEventDialog.start(message, message.guild.id);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
