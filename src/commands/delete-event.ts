'use strict';

import {Client} from 'discord.js';
import Command from '../base/command';
import DeleteEventDialog from '../dialogs/delete-event';

export default class DeleteEventCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'delete',
      dmOnly: true,
      usage: 'delete',
    });
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    return DeleteEventDialog.start(message);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
