import {UserConversation} from '../cache/conversation-manager';

export default abstract class Dialog {
  public type: string;
  abstract run(message: EnrichedMessage, conversation: UserConversation): Promise<void>;
  abstract messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean;
}
