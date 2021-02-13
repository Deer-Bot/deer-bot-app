import {Client, EmojiResolvable, Message} from 'discord.js';
import DialogHandler from '../base/dialog-handler';
import CommandHandler from '../base/command-handler';

declare global {
  export interface EnrichedMessage extends Message {
    prefix?: string;
    reaction?: EmojiResolvable
  }

  export interface EnrichedClient extends Client {
    commands?: CommandHandler;
    dialogs?: DialogHandler;
  }
}
