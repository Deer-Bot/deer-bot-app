'use strict';

import {Client, PermissionResolvable} from 'discord.js';

interface CommandOptions {
    name: string,
    permissions?: PermissionResolvable[],
    guildOnly?: boolean,
    usage: string
}

export default abstract class Command {
  public name: string;
  protected permissions: PermissionResolvable[];
  protected guildOnly: boolean;
  protected usage: string;
  protected endpoint: string;

  constructor(client: Client, commandOptions: CommandOptions) {
    this.name = commandOptions.name;
    this.permissions = commandOptions.permissions || null;
    this.guildOnly = commandOptions.guildOnly || false;
    this.usage = commandOptions.usage || '';

    this.endpoint = process.env.API_ENDPOINT;
  }

  public async execute(message: EnrichedMessage, args: string[]): Promise<any> {
    if (!this.checkRightChannel(message)) {
      return;
    }
    if (!this.userHasPermissions(message)) {
      return message.reply('you do not have the required permission to execute this command.');
    }
    if (!this.checkArgs(args)) {
      return message.reply(`the usage of this command is: ${message.prefix}${this.usage}`);
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
    message.reply('something went wrong while executing the command.');
    return;
  }
}
