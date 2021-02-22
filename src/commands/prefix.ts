import Command from '../base/command';
import GuildInfoManager from '../cache/guild-info-manager';
import MessageDecorator from '../common/message-decorator';

export default class PrefixCommand extends Command {
  constructor() {
    super({
      name: 'prefix',
      description: 'Set a custom prefix for your server.',
      permissions: ['MANAGE_GUILD'],
      guildOnly: true,
      usage: `prefix <new prefix>`,
    });
  }

  protected async run(message: EnrichedMessage, args: string[]) {
    // Salva il nuovo prefisso
    await GuildInfoManager.set(message.guild.id, {prefix: args[0]});

    return message.reply(MessageDecorator.message(`Your new prefix is ${args[0]}`));
  }

  protected checkArgs(args: string[]) {
    return args.length == 1;
  }
}
