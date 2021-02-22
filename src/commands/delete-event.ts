import Command from '../base/command';
import DeleteEventDialog from '../dialogs/delete-event';

export default class DeleteEventCommand extends Command {
  constructor() {
    super({
      name: 'delete',
      description: 'Deletes one of the events you created.',
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
