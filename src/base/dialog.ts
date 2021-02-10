import {UserConversation} from '../cache/session';

export default abstract class Dialog {
  public type: string;
  abstract run(message: EnrichedMessage, conversation: UserConversation): Promise<void>;
}
