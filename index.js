'use strict';

require('dotenv').config();
const axios = require('axios');
axios.defaults.baseUrl = process.env.API_ENDPOINT;
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const Prefix = require('./cache/prefix.js');

loadCommands(client);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
  if (message.author.bot || (message.channel.type !== 'dm' && message.channel.type !== 'text')) {
    return;
  }
  // Prefix del server o quello di default
  let prefix;
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
      .catch((err) => console.log(err));
});

client.login(process.env.DISCORD_TOKEN);

function getCommand(message) {
  const args = message.content.slice(message.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  return {commandName: command, args: args};
}

function loadCommands(client) {
  client.commands = new Discord.Collection();

  let commandFileNames = fs.readdirSync('./commands');
  commandFileNames = commandFileNames.filter((name) => name.endsWith('.js'));
  for (const name of commandFileNames) {
    const command = new (require(`./commands/${name}`))();
    client.commands.set(command.name, command);
  }
}
