class Command {
  constructor(client, commandOptions) {
    this.name = commandOptions.name;
    this.permissions = commandOptions.permissions || null;
    this.guildOnly = commandOptions.guildOnly || false;

    this.endpoint = process.env.API_ENDPOINT;
  }

  async execute(message, args) {
    if (!this.checkRightChannel(message)) {
      return;
    }
    if (!this.userHasPermissions(message)) {
      return message.reply('you do not have the required permission to execute this command.');
    }

    // dopo tutti i controlli...
    return this.run(message, args);
  }

  async run(message, args) {}

  checkRightChannel(message) {
    if (this.guildOnly) {
      return message.guild != undefined;
    }
    return true;
  }

  userHasPermissions(message) {
    if (this.permissions == null || message.channel.type === 'dm') {
      return true;
    }

    let permission = true;
    for (let i = 0; i < this.permissions.length && permission; i++) {
      permission = permission && message.member.hasPermission(this.permissions[i]);
    }
    return permission;
  }

  sendError(message) {
    message.reply('something went wrong while executing the command.');
    return;
  }
}

module.exports = Command;
