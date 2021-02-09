'use strict';

require('dotenv').config();
import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import Prefix from './cache/prefix.js';
const client = new Discord.Client() as EnrichedClient;

loadCommands(client);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message: EnrichedMessage) => {
  if (message.author.bot || (message.channel.type !== 'dm' && message.channel.type !== 'text')) {
    return;
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
      .catch((err: any) => console.log(err));
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
    const cmd = require(`./commands/${name}`).default;
    const command = new cmd();
    client.commands.set(command.name, command);
  }
}
