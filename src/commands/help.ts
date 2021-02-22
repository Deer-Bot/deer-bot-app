import {Collection} from 'discord.js';
import GuildInfoManager from '../cache/guild-info-manager';
import Command from '../base/command';
import MessageDecorator from '../common/message-decorator';

export interface CommandInfo {
  name: string,
  description: string,
  usage?: string
  guildOnly?: boolean,
  dmOnly?: boolean
}

export default class HelpCommand extends Command {
  public static isHelp = true;
  private commands;

  constructor(commands: Collection<string, Command>) {
    super({
      name: 'help',
      usage: 'help [command name]',
      description: 'Shows a help message based on the command as argument.',
    });
    this.commands = commands;
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    let prefix = GuildInfoManager.defaultPrefix;

    if (message.channel.type === 'text') {
      prefix = (await GuildInfoManager.get(message.guild.id)).prefix;
    }

    if (args.length === 0) {
      const commandsInfos = this.commands.map((command) => {
        return {name: command.name, description: command.description};
      });

      message.channel.send(MessageDecorator.commandsList(prefix, commandsInfos));
    } else {
      if (this.commands.has(args[0])) {
        const command = this.commands.get(args[0]);
        const commandInfo = {
          name: command.name,
          description: command.description,
          usage: command.usage,
          dmOnly: command.dmOnly,
          guildOnly: command.guildOnly,
        };

        message.channel.send(MessageDecorator.commandEmbed(prefix, commandInfo));
      } else {
        message.channel.send(MessageDecorator.commandError(
            'Unknown command',
            `\`${args[0]}\` is not a valid command.\nUse the \`help\` command to see all the available commands.`,
        ));
      }
    }
  }

  protected checkArgs(args: string[]) {
    return args.length <= 1;
  }
}
