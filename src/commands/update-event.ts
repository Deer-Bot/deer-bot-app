import {Client} from 'discord.js';
import GuildInfoManager from '../cache/guild-info-manager';
import MessageDecorator from '../common/message-decorator';
import Command from '../base/command';
import UpdateEventDialog from '../dialogs/update-event';

export default class UpdateEventCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'update',
      dmOnly: true,
      usage: 'update',
    });
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    const guildInfo = await GuildInfoManager.get(message.guild.id);

    if (guildInfo.channelId === GuildInfoManager.unspecifiedChannel) {
      return message.reply(MessageDecorator.commandError('You must set a default channel before updating an event, use the `channel` command.'));
    }

    return UpdateEventDialog.start(message);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
