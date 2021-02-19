import {Client} from 'discord.js';
import InputValidator from '../common/input-validator';
import Command from '../base/command';
import MessageDecorator from '../common/message-decorator';
import GuildInfoManager from '../cache/guild-info-manager';

export default class TimezoneCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'timezone',
      permissions: ['ADMINISTRATOR'],
      guildOnly: true,
      usage: 'timezone <timezone offset>',
    });
  }

  protected async run(message: EnrichedMessage, args: string[]) {
    if (!InputValidator.validateTimezoneOffset(args[0])) {
      message.reply(MessageDecorator.commandError('The timezone offset must be a number between -12 and +12'));
      return;
    }
    await GuildInfoManager.set(message.guild.id, {timezoneOffset: Number.parseInt(args[0])});
    return message.reply(MessageDecorator.okMessage());
  }

  protected checkArgs(args: string[]) {
    return args.length == 1;
  }
}
