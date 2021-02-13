'use strict';

import {Client} from 'discord.js';
import Command from '../base/command.js';
import UpdateEventDialog from '../dialogs/update-event.js';

export default class UpdateEventCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'update',
      dmOnly: true,
      usage: 'update',
      // TODO: other command options
    });
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    return UpdateEventDialog.start(message);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
