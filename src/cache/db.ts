import {UserConversation} from './session';

interface GetFunction {
  (key: string): Promise<string | UserConversation>
}

interface SetFunction {
  (key: string, value: any): Promise<string>
}

interface DelFunction {
  (key: string): Promise<number>
}

export default class RedisDb {
  public readonly index: number;
  public readonly ttl: number;
  public readonly get: GetFunction;
  public readonly set: SetFunction;
  public readonly del: DelFunction;

  public constructor(index: number, ttl: number, get: GetFunction, set: SetFunction, del: DelFunction) {
    this.index = index;
    this.ttl = ttl;
    this.get = get;
    this.set = set;
    this.del = del;
  }
}
