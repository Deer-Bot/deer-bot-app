import {time} from 'console';

const dateRegex = new RegExp(/^(?:(?:31(-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/);
const timeRegex = new RegExp(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
const numberRegex = new RegExp(/^\d+$/);
const timezoneRegex = new RegExp(/^(?:\+|-)?(?:0|[1-9]|1[0-2])$/);


export default class InputValidator {
  public static validateDate(date: string): boolean {
    return dateRegex.test(date);
  }

  public static validateTime(time: string): boolean {
    return timeRegex.test(time);
  }

  public static validateNumber(number: string): boolean {
    return numberRegex.test(number);
  }

  public static validateTimezoneOffset(timezoneOffset: string) {
    return timezoneRegex.test(timezoneOffset);
  }
}
