// Weekday
export const DAYS: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const MEDIUM_DAYS: string[] = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];
export const SMALL_DAYS: string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// Month
export const MONTHS: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const MEDIUM_MONTHS: string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const SMALL_MONTHS: string[] = [
  'J',
  'F',
  'M',
  'A',
  'M',
  'J',
  'J',
  'A',
  'S',
  'O',
  'N',
  'D',
];
// Year
export const FIRST_YEAR: number = 1970;
export const LAST_YEAR: number = 2100;
export const END_DATES: number[] = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

export const DAYS_OF_WEEK: Set<DayOfWeek> = new Set<DayOfWeek>();
DAYS_OF_WEEK.add('sunday');
DAYS_OF_WEEK.add('monday');
DAYS_OF_WEEK.add('tuesday');
DAYS_OF_WEEK.add('wednesday');
DAYS_OF_WEEK.add('thursday');
DAYS_OF_WEEK.add('friday');
DAYS_OF_WEEK.add('saturday');

export const TIME_OF_DAYS: Set<TimeOfDay> = new Set<TimeOfDay>();
TIME_OF_DAYS.add('night');
TIME_OF_DAYS.add('morning');
TIME_OF_DAYS.add('afternoon');
TIME_OF_DAYS.add('evening');

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type TimeOfDay = 'night' | 'morning' | 'afternoon' | 'evening';
