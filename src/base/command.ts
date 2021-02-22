import {PermissionResolvable} from 'discord.js';
import MessageDecorator from '../common/message-decorator';

interface CommandOptions {
    name: string,
    description: string
    permissions?: PermissionResolvable[],
    guildOnly?: boolean,
    dmOnly?: boolean,
    usage: string
}

export default abstract class Command {
  public name: string;
  public description: string;
  protected permissions: PermissionResolvable[];
  protected guildOnly: boolean;
  protected dmOnly: boolean;
  protected usage: string;

  constructor(commandOptions: CommandOptions) {
    this.name = commandOptions.name;
    this.description = commandOptions.description;
    this.permissions = commandOptions.permissions || null;
    this.guildOnly = commandOptions.guildOnly || false;
    this.dmOnly = commandOptions.dmOnly || false;
    this.usage = commandOptions.usage || '';
  }

  public async execute(message: EnrichedMessage, args: string[]): Promise<any> {
    if (!this.checkRightChannel(message)) {
      return;
    }
    if (!this.userHasPermissions(message)) {
      return message.reply(MessageDecorator.commandError('You do not have the required permission to execute this command.'));
    }
    if (!this.checkArgs(args)) {
      return message.reply(MessageDecorator.commandError(`The usage of this command is: ${message.prefix}${this.usage}`));
    }

    // dopo tutti i controlli...
    return this.run(message, args);
  }

  protected abstract run(message: EnrichedMessage, args: string[]): Promise<any>;

  protected checkArgs(args: string[]): boolean {
    return true;
  }

  protected checkRightChannel(message: EnrichedMessage): boolean {
    if (this.guildOnly) {
      return message.guild != undefined;
    }
    if (this.dmOnly) {
      return message.channel.type === 'dm';
    }
    return true;
  }

  protected userHasPermissions(message: EnrichedMessage): boolean {
    if (this.permissions == null || message.channel.type === 'dm') {
      return true;
    }

    let permission: boolean = true;
    for (let i = 0; i < this.permissions.length && permission; i++) {
      permission = permission && message.member.hasPermission(this.permissions[i]);
    }
    return permission;
  }

  protected sendError(message: EnrichedMessage): void {
    message.reply(MessageDecorator.commandError());
    return;
  }
}
