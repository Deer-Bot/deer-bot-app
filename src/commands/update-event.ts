import Command from '../base/command';
import UpdateEventDialog from '../dialogs/update-event';

export default class UpdateEventCommand extends Command {
  constructor() {
    super({
      name: 'update',
      description: 'Used to update one of the events you created.',
      dmOnly: true,
      usage: 'update',
    });
  }

  protected async run(message: EnrichedMessage, args: string[]): Promise<any> {
    return UpdateEventDialog.start(message);
  }

  protected checkArgs(args: string[]) {
    return args.length === 0;
  }
}
