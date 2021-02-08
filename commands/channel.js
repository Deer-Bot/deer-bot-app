const Command = require('../base/command.js');
const axios = require('axios').default;

class ChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'channel',
      permissions: ['ADMINISTRATOR'],
      guildOnly: true,
      usage: 'channel [channel name](optional)',
      // TODO: other command options
    });
  }

  async run(message, args) {
    const channelId = message.channel.id;
    if (args.length !== 0) {
      const channelIds = message.guild.channels.cache.filter((channel) => channel.name === args[0]);
      if (channelIds.length === 0) {
        return message.reply('I could not find the channel you specified.');
      }
      if (channelIds.length > 1) {
        return message.reply('there are too many channels with that name, use the command in the desired channel without any arguments.');
      }
      channelId = channelIds[0];
    }

    try {
      const res = await axios.post(`${this.endpoint}setGuild`, {guild: message.guild.id, channel: channelId});
      if (res.status === 200) {
        message.reply('all set.');
      } else {
        this.sendError(message);
      }
    } catch (err) {
      this.sendError(message);
    }
    return;
  }

  checkArgs(args) {
    return args.length < 2;
  }
}

module.exports = ChannelCommand;
