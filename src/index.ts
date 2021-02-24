require('dotenv').config();
import path from 'path';
import Discord, {Guild, GuildChannel, MessageEmbed, MessageReaction, TextChannel} from 'discord.js';
import GuildInfoManager from './cache/guild-info-manager';
import ConversationManager, {MessageInfo} from './cache/conversation-manager';
import EventMessageManager from './cache/event-message-manager';
import DialogHandler from './base/dialog-handler';
import CommandHandler from './base/command-handler';
import MessageDecorator from './common/message-decorator';
import ApiClient from './api/api-client';

const client = new Discord.Client() as EnrichedClient;
client.dialogs = new DialogHandler(path.resolve(__dirname, 'dialogs'));
client.commands = new CommandHandler(path.resolve(__dirname, 'commands'));

client.on('ready', () => {
  fetchOldMessages();
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('error', (err) => console.log(`Error: ${err}`));

client.on('message', async (message: EnrichedMessage) => {
  if (message.author.bot || (message.channel.type !== 'dm' && message.channel.type !== 'text')) {
    return;
  }

  if (message.channel.type == 'dm') {
    const conversation = await ConversationManager.get(message.author.id);
    if (conversation != undefined) {
      // Checks if the current message is part of the conversation
      if (client.dialogs.expect(message, conversation)) {
        client.dialogs.continue(message, conversation, message.author)
            .catch((err: any) => {
              message.reply(MessageDecorator.conversationError());
              console.log(err);
            });
        return;
      }
    }
  }

  // Prefix del server o quello di default
  let prefix: string;
  try {
    prefix = (await GuildInfoManager.get(message.guild?.id)).prefix;
  } catch (err) {
    console.log(err.message);
  }

  message.prefix = prefix || GuildInfoManager.defaultPrefix;
  if (!message.content.startsWith(message.prefix)) {
    return;
  }
  const {commandName, args} = getCommand(message);

  client.commands.run(commandName, args, message);
});

client.on('messageReactionAdd', async (messageReaction, user) => {
  handleReaction(messageReaction, user, true)
      .catch((err) => console.log(err));
});

client.on('messageReactionRemove', async (messageReaction, user) => {
  handleReaction(messageReaction, user, false)
      .catch((err) => console.log(err));
});

const handleReaction = async (messageReaction: MessageReaction, user: Discord.User | Discord.PartialUser, emojiAdded: boolean): Promise<void> => {
  if (user.bot) {
    return;
  }

  const message: EnrichedMessage = messageReaction.message;
  message.reaction = messageReaction.emoji;

  if (message.channel.type === 'dm') {
    const conversation = await ConversationManager.get(user.id);
    if (conversation != null && message.id === conversation.messageId) {
      client.dialogs.continue(message, conversation, user)
          .catch((err: any) => {
            message.reply(MessageDecorator.conversationError());
            console.log(err);
          });
      return;
    }
  } else if (
    message.channel.type === 'text' &&
    message.author.id === client.user.id &&
    message.reaction.toString() === MessageDecorator.confirmEmoji
  ) {
    const eventId = await EventMessageManager.get(message.id);
    if (eventId == null) {
      return;
    }
    ApiClient.post('setParticipant', {userId: user.id, eventId: eventId, add: emojiAdded})
        .catch((err) => console.log(err));
  }
};

client.on('guildCreate', (guild) => {
  warningMessage(guild, MessageDecorator.setupMessage());
});

client.on('guildDelete', (guild) => {
  ApiClient.delete('deleteGuildData', {guildId: guild.id})
      .catch((err) => {
        console.log(err.message);
      });
});

client.on('channelDelete', async (channel) => {
  if (channel.type === 'text') {
    const guild = (channel as GuildChannel).guild;
    const guildInfo = await GuildInfoManager.get(guild.id);

    if (channel.id === guildInfo.channelId) {
      guildInfo.channelId = GuildInfoManager.unspecifiedChannel;
      await GuildInfoManager.set(guild.id, guildInfo);
      warningMessage(guild, MessageDecorator.setupNewChannelMessage(guildInfo.prefix));
    }
  }
});


client.login();

function getCommand(message: EnrichedMessage) {
  const args = message.content.slice(message.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  return {commandName: command, args: args};
}

function warningMessage(guild: Guild, embed: MessageEmbed) {
  let foundAChannel = false;
  for (const [, channel] of guild.channels.cache) {
    if (channel.type == 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
      foundAChannel = true;
      (channel as TextChannel).send(embed);
      break;
    }
  }

  if (!foundAChannel) {
    guild.owner.send(embed);
  }
}

function fetchOldMessages(): void {
  ApiClient.get('getAllMessageInfo')
      .then((body) => {
        const messageInfos: MessageInfo[] = body.messageInfos;
        return Promise.all(messageInfos.map((messageInfo: MessageInfo) => {
          return client.channels.fetch(messageInfo.channelId)
              .then((channel) => (channel as TextChannel).messages.fetch(messageInfo.messageId));
        }));
      })
      .catch((err) => {
        console.log(err.message);
        setTimeout(fetchOldMessages, 5000);
      });
}
