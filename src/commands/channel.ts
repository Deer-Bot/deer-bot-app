import Command from '../base/command';
import MessageDecorator from '../common/message-decorator';
import GuildInfoManager from '../cache/guild-info-manager';

export default class ChannelCommand extends Command {
  constructor() {
    super({
      name: 'channel',
      description: 'Set a event broadcasting channel for your server.',
      permissions: ['MANAGE_GUILD'],
      guildOnly: true,
      usage: 'channel [channel name](optional)',
    });
  }

  protected async run(message: EnrichedMessage, args: string[]) {
    let channelId = message.channel.id;
    if (args.length !== 0) {
      const channelIds = message.guild.channels.cache.filter((channel) => channel.name === args[0]);
      if (channelIds.size === 0) {
        return message.reply(MessageDecorator.commandError('I could not find the channel you specified.'));
      }
      if (channelIds.size > 1) {
        return message.reply(MessageDecorator.commandError('There are too many channels with that name, use the command in the desired channel without any arguments.'));
      }
      channelId = channelIds.first().id;
    }

    await GuildInfoManager.set(message.guild.id, {channelId: channelId});
    return message.reply(MessageDecorator.okMessage());
  }

  protected checkArgs(args: string[]) {
    return args.length < 2;
  }
}
