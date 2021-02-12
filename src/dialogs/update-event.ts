import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import {UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';

const dateRegex = /^(?:(?:31(-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/;
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const numberRegex = /^\d+$/;

export default class UpdateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'update';
  }

  static async start(message: EnrichedMessage): Promise<void> {
    const conversation: UserConversation = {
      type: 'update',
      step: 0,
    };

    // Chiama la Function per prendere gli eventi dell'utente
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {

  }
}
