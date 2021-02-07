require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const defaultPrefix = '!';

loadCommands(client);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
  if (message.channel.type !== 'dm' && message.channel.type !== 'text') {
    return;
  }

  // prendere il prefisso della guild (e metterlo in cache)
  if (!message.content.startsWith(defaultPrefix) || message.author.bot) {
    return;
  }

  const {commandName, args} = getCommand(message);

  if (!client.commands.has(commandName)) {
    return;
  }

  client.commands.get(commandName).execute(message, args);
});

client.login(process.env.DISCORD_TOKEN);

function getCommand(message) {
  const args = message.content.slice(defaultPrefix.length).trim().split(/ +/);
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
