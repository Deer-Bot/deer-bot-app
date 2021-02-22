import ParticipantsDialog from '../dialogs/participants';
import Command from '../base/command';

export default class ParticipantsCommand extends Command {
  constructor() {
    super({
      name: 'participants',
      description: 'Show the participants to your events.',
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
