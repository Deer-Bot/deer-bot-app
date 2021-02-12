'use strict';

require('dotenv').config();
import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import Prefix from './cache/prefix.js';
import Session from './cache/session';
import DialogHandler from './base/dialog-handler';

const client = new Discord.Client() as EnrichedClient;


loadCommands(client);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.dialogs = new DialogHandler(path.resolve(__dirname, 'dialogs'));
});

client.on('message', async (message: EnrichedMessage) => {
  if (message.author.bot || (message.channel.type !== 'dm' && message.channel.type !== 'text')) {
    return;
  }

  if (message.channel.type == 'dm') {
    const conversation = await Session.get(message.author.id);
    if (conversation != null) {
      client.dialogs.continue(message, conversation)
          .catch((err: any) => {
            message.reply('something went wrong during the conversation.');
            console.log(err);
          });
      return;
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

  if (!client.commands.has(commandName)) {
    return;
  }

  client.commands.get(commandName).execute(message, args)
      .catch((err: any) => {
        message.reply('something went wrong while executing the command.');
        console.log(err);
      });
});

client.on('messageReactionAdd', async (messageReaction, user) => {
  if (user.bot) {
    return;
  }

  const message: EnrichedMessage = messageReaction.message;
  message.reaction = messageReaction.emoji;

  if (message.channel.type == 'dm') {
    const conversation = await Session.get(user.id);
    if (conversation != null && message.id === conversation.messageId) {
      client.dialogs.continue(message, conversation)
          .catch((err: any) => {
            message.reply('something went wrong during the conversation.');
            console.log(err);
          });
      return;
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

function getCommand(message: EnrichedMessage) {
  const args = message.content.slice(message.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  return {commandName: command, args: args};
}

function loadCommands(client: EnrichedClient) {
  client.commands = new Discord.Collection();

  let commandFileNames = fs.readdirSync(path.resolve(__dirname, 'commands'));
  commandFileNames = commandFileNames.filter((name) => name.endsWith('.js'));
  for (const name of commandFileNames) {
    const Cmd = require(`./commands/${name}`).default;
    const command = new Cmd();
    client.commands.set(command.name, command);
  }
}
