import {Collection} from 'discord.js';
import GuildInfoManager from '../cache/guild-info-manager';
import Command from '../base/command';
import MessageDecorator from '../common/message-decorator';

export interface CommandInfo {
  name: string,
  description: string,
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
    if (args.length === 0) {
      let prefix = GuildInfoManager.defaultPrefix;
      if (message.channel.type === 'text') {
        prefix = (await GuildInfoManager.get(message.guild.id)).prefix;
      }

      const commandsInfos = this.commands.map((command) => {
        return {name: command.name, description: command.description};
      });

      message.channel.send(MessageDecorator.commandsList(prefix, commandsInfos ));
    }
  }

  protected checkArgs(args: string[]) {
    return args.length <= 1;
  }
}
