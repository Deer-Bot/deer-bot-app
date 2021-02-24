import {Tedis} from 'tedis';

interface GetFunction {
  (key: string, tedis: Tedis): Promise<number | string | {[index: string]: string}>
}

interface SetFunction {
  (key: string, value: any, tedis: Tedis): Promise<string>
}

interface DelFunction {
  (key: string, tedis: Tedis): Promise<number>
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
