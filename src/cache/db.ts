import {UserConversation} from './session';

interface GetFunction {
  (key: string): Promise<string | UserConversation>
}

interface SetFunction {
  (key: string, value: any): Promise<string>
}

export default class RedisDb {
  public readonly index: number;
  public readonly ttl: number;
  public readonly get: GetFunction;
  public readonly set: SetFunction;

  public constructor(index: number, ttl: number, get: GetFunction, set: SetFunction) {
    this.index = index;
    this.ttl = ttl;
    this.get = get;
    this.set = set;
  }
}
