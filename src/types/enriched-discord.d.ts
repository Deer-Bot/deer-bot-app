import { Client, Collection, Message } from "discord.js";
import Command from "../base/command";

declare global {
  export interface  EnrichedMessage extends Message {
    prefix?: string;
  }

  export interface EnrichedClient extends Client {
    commands?: Collection<string, Command>;
  }
}
