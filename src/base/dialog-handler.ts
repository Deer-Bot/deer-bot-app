import {Collection} from 'discord.js';
import fs from 'fs';
import Session, {UserConversation} from '../cache/session';
import Dialog from './dialog';

export default class DialogHandler {
  private path: string;
  private dialogs: Collection<string, Dialog>;

  constructor(path: string) {
    this.path = path;
    this.dialogs = new Collection();
    this.initialize();
  }

  private initialize() {
    let dialogFileNames = fs.readdirSync(`${this.path}`);

    dialogFileNames = dialogFileNames.filter((name) => name.endsWith('.js'));
    for (const filename of dialogFileNames) {
      const Dlg = require(`${this.path}/${filename}`).default;
      const dialog = new Dlg();
      this.dialogs.set(dialog.type, dialog);
    }
  }

  public expect(message: EnrichedMessage, conversation: UserConversation): boolean {
    const type = conversation.type;
    return this.dialogs.get(type).messageBelongToDialog(message, conversation);
  }

  public async continue(message: EnrichedMessage, conversation: UserConversation) {
    const type = conversation.type;
    await this.dialogs.get(type).run(message, conversation);
    await Session.update(message.author.id, conversation);
  }
}
