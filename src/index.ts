'use strict';

require('dotenv').config();
import path from 'path';
import Discord, {MessageReaction} from 'discord.js';
import Prefix from './cache/prefix.js';
import Session from './cache/session';
import DialogHandler from './base/dialog-handler';
import CommandHandler from './base/command-handler.js';
import EventMessage from './cache/event-message.js';
import MessageDecorator from './common/message-decorator.js';
import ApiClient from './api/api-client.js';

const client = new Discord.Client() as EnrichedClient;
client.dialogs = new DialogHandler(path.resolve(__dirname, 'dialogs'));
client.commands = new CommandHandler(path.resolve(__dirname, 'commands'));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message: EnrichedMessage) => {
  if (message.author.bot || (message.channel.type !== 'dm' && message.channel.type !== 'text')) {
    return;
  }

  if (message.channel.type == 'dm') {
    const conversation = await Session.get(message.author.id);
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
    prefix = await Prefix.get(message.guild?.id);
  } catch (err) {
    console.log(err);
  }

  message.prefix = prefix || Prefix.defaultPrefix;
  if (!message.content.startsWith(message.prefix)) {
    return;
  }

  const {commandName, args} = getCommand(message);

  client.commands.run(commandName, args, message)
      .catch((err) => console.log(err));
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
    const conversation = await Session.get(user.id);
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
    const eventId = await EventMessage.get(message.id);
    if (eventId == null) {
      return;
    }
    ApiClient.post('setParticipant', {userId: user.id, eventId: eventId, add: emojiAdded})
        .catch((err) => console.log(err));
  }
};

client.login(process.env.DISCORD_TOKEN);

function getCommand(message: EnrichedMessage) {
  const args = message.content.slice(message.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  return {commandName: command, args: args};
}
