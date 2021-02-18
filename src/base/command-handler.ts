import {Collection} from 'discord.js';
import fs from 'fs';
import MessageDecorator from '../common/message-decorator';
import Command from './command';

export default class CommandHandler {
  private path: string;
  private commands: Collection<string, Command>;

  constructor(path: string) {
    this.path = path;
    this.commands = new Collection();
    this.initialize();
  }

  private initialize() {
    let commandFileNames = fs.readdirSync(`${this.path}`);

    commandFileNames = commandFileNames.filter((name) => name.endsWith('.js'));
    for (const filename of commandFileNames) {
      const Cmd = require(`${this.path}/${filename}`).default;
      const command = new Cmd();
      this.commands.set(command.name, command);
    }
  }

  public async run(commandName: string, args: string[], message: EnrichedMessage): Promise<void> {
    if (!this.commands.has(commandName)) {
      return;
    }

    this.commands.get(commandName).execute(message, args)
        .catch((err: any) => {
          message.reply(MessageDecorator.commandError());
          console.log(err);
        });
  }
}
