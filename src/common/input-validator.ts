// TODO: aggiungere gli '/'
const dateRegex = new RegExp(/^(?:(?:31(-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/);
const timeRegex = new RegExp(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
const numberRegex = new RegExp(/^\d+$/);
const timezoneRegex = new RegExp(/^(?:\+|-)?(?:0|[1-9]|1[0-2])$/);


export default class InputValidator {
  public static validateDate(date: string, timezoneOffset: number): ('patternError' | 'timeError'| 'ok') {
    if (!dateRegex.test(date)) {
      return 'patternError';
    }

    const [day, month, year] = date.split('-').map((value) => Number.parseInt(value));
    const now = new Date(Date.now());

    // Data "attuale"(fittizia dell'utente) dell'utente in base alla sua timezone (serve per vedere se in base al fusorario il giorno è già passato)
    const currentUserDate = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours() + timezoneOffset,
            now.getUTCMinutes(),
        ),
    );
    currentUserDate.setUTCMinutes(0);
    currentUserDate.setUTCHours(0);

    // Data inserita dall'utente
    const inputDate = new Date(Date.UTC(year, month - 1, day));
    inputDate.setUTCHours(0);
    inputDate.setUTCMinutes(0);

    // compara se la data inserita è più piccola di quella attuale (in particolare in termini di giorni e non di ore)
    if (inputDate.getTime() < currentUserDate.getTime()) {
      return 'timeError';
    }

    return 'ok';
  }

  public static validateDateTime(date: string, time: string, timezoneOffset: number): Date|'patternError'|'timeError' {
    if (!timeRegex.test(time)) {
      return 'patternError';
    }
    const [day, month, year] = date.split('-').map((value) => Number.parseInt(value));
    const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value));

    const now = new Date(Date.now());
    const inputDate = new Date(Date.UTC(year, month - 1, day, hours - timezoneOffset, minutes));

    if (inputDate.getTime() < now.getTime()) {
      return 'timeError';
    }

    return inputDate;
  }

  public static validateDateUpdate(date: string, prevDate: Date, timezoneOffset: number): Date|'patternError'|'timeError' {
    if (!dateRegex.test(date)) {
      return 'patternError';
    }

    const [day, month, year] = date.split('-').map((value) => Number.parseInt(value));
    const now = new Date(Date.now());

    const currentUserDate = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours() + timezoneOffset,
            now.getUTCMinutes(),
        ),
    );
    const inputDate = new Date(Date.UTC(year, month - 1, day, mod(prevDate.getUTCHours() + timezoneOffset, 24), prevDate.getUTCMinutes()));

    if (inputDate.getTime() < currentUserDate.getTime()) {
      return 'timeError';
    }

    // Time in UTC
    inputDate.setUTCHours(inputDate.getUTCHours() - timezoneOffset);

    return inputDate;
  }

  public static validateDateTimeUpdate(prevDate: Date, time: string, timezoneOffset: number): Date|'patternError'|'timeError' {
    if (!timeRegex.test(time)) {
      return 'patternError';
    }

    prevDate.setUTCHours(prevDate.getUTCHours() + timezoneOffset);
    const [day, month, year] = [prevDate.getUTCDate(), prevDate.getUTCMonth(), prevDate.getUTCFullYear()];
    const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value));
    const now = new Date(Date.now());
    const inputDate = new Date(Date.UTC(year, month, day, hours - timezoneOffset, minutes));

    // Compare current time with new time
    if (inputDate.getTime() < now.getTime()) {
      return 'timeError';
    }

    return inputDate;
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

  public static v(date: Date, timezoneOffset: number): boolean {
    return true;
  }
}

const mod = (n: number, mod: number): number => {
  let x = n % mod;
  if (x < 0) {
    x = x + mod;
  }
  return x;
};
