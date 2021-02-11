import Discord from 'discord.js';
import {Event} from '../cache/session';

export default class MessageDecorator {
  public static async newEventMessage(client: Discord.Client, event: Event, isAuthor: boolean): Promise<Discord.MessageEmbed> {
    const guild = await client.guilds.fetch(event.guild);
    const member = await guild.members.fetch(event.author);

    const embed = new Discord.MessageEmbed();
    embed.setTitle(event.name)
        .setDescription(event.description)
        .setAuthor(member.displayName, member.user.displayAvatarURL())
        .addField('Date', event.date)
        .setColor('#FFD700')
        .setTimestamp();

    if (isAuthor) {
      embed.addFields(
          {name: 'Server reminder', value: `Every ${event.globalReminder} day(s)`, inline: true},
          {name: 'Private reminder', value: `${event.privateReminder} hour(s) before the event`, inline: true},
      );
    }

    return embed;
  }
}
