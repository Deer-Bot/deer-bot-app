'use strict';

import {Client} from 'discord.js';
import ParticipantsDialog from '../dialogs/participants';
import Command from '../base/command';

export default class ParticipantsCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'participants',
      dmOnly: true,
      usage: 'participants',
    });
  }

  protected run(message: EnrichedMessage, args: string[]): Promise<any> {
    return ParticipantsDialog.start(message);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
