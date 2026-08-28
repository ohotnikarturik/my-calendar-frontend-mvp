/**
 * IANA timezone options for Settings and email reminders.
 * Values are stored in the database (e.g. Europe/Helsinki).
 */

export interface TimezoneOption {
  value: string;
  label: string;
}

export interface TimezoneRegion {
  region: string;
  timezones: TimezoneOption[];
}

/** Detect browser/device timezone, fallback UTC */
export function detectBrowserTimezone(): string {
  if (typeof Intl === 'undefined') {
    return 'UTC';
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Current UTC offset label for a timezone, e.g. "UTC+3" */
export function formatTimezoneOffset(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const part = formatter
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

/** Display label: "Helsinki (UTC+3)" */
export function formatTimezoneLabel(option: TimezoneOption): string {
  const offset = formatTimezoneOffset(option.value);
  return offset ? `${option.label} (${offset})` : option.label;
}

/** Full label including IANA id for clarity */
export function formatTimezoneLabelWithId(option: TimezoneOption): string {
  const offset = formatTimezoneOffset(option.value);
  const base = offset ? `${option.label} (${offset})` : option.label;
  return `${base} — ${option.value}`;
}

export const TIMEZONE_REGIONS: TimezoneRegion[] = [
  {
    region: 'UTC',
    timezones: [{ value: 'UTC', label: 'UTC' }],
  },
  {
    region: 'Europe',
    timezones: [
      { value: 'Europe/Helsinki', label: 'Helsinki' },
      { value: 'Europe/Kyiv', label: 'Kyiv' },
      { value: 'Europe/Moscow', label: 'Moscow' },
      { value: 'Europe/Riga', label: 'Riga' },
      { value: 'Europe/Tallinn', label: 'Tallinn' },
      { value: 'Europe/Vilnius', label: 'Vilnius' },
      { value: 'Europe/Stockholm', label: 'Stockholm' },
      { value: 'Europe/Oslo', label: 'Oslo' },
      { value: 'Europe/Copenhagen', label: 'Copenhagen' },
      { value: 'Europe/Warsaw', label: 'Warsaw' },
      { value: 'Europe/Berlin', label: 'Berlin' },
      { value: 'Europe/Paris', label: 'Paris' },
      { value: 'Europe/Amsterdam', label: 'Amsterdam' },
      { value: 'Europe/London', label: 'London' },
      { value: 'Europe/Madrid', label: 'Madrid' },
      { value: 'Europe/Rome', label: 'Rome' },
      { value: 'Europe/Athens', label: 'Athens' },
      { value: 'Europe/Bucharest', label: 'Bucharest' },
      { value: 'Europe/Istanbul', label: 'Istanbul' },
    ],
  },
  {
    region: 'Americas',
    timezones: [
      { value: 'America/New_York', label: 'New York' },
      { value: 'America/Chicago', label: 'Chicago' },
      { value: 'America/Denver', label: 'Denver' },
      { value: 'America/Los_Angeles', label: 'Los Angeles' },
      { value: 'America/Toronto', label: 'Toronto' },
      { value: 'America/Vancouver', label: 'Vancouver' },
      { value: 'America/Mexico_City', label: 'Mexico City' },
      { value: 'America/Sao_Paulo', label: 'São Paulo' },
    ],
  },
  {
    region: 'Asia & Pacific',
    timezones: [
      { value: 'Asia/Dubai', label: 'Dubai' },
      { value: 'Asia/Kolkata', label: 'India' },
      { value: 'Asia/Shanghai', label: 'Shanghai' },
      { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
      { value: 'Asia/Singapore', label: 'Singapore' },
      { value: 'Asia/Tokyo', label: 'Tokyo' },
      { value: 'Australia/Sydney', label: 'Sydney' },
      { value: 'Pacific/Auckland', label: 'Auckland' },
    ],
  },
];

export const ALL_TIMEZONE_OPTIONS: TimezoneOption[] = TIMEZONE_REGIONS.flatMap(
  (group) => group.timezones
);

/** Include saved value if it is not in our preset list (custom/legacy). */
export function buildTimezoneRegions(currentValue?: string | null): TimezoneRegion[] {
  if (!currentValue || ALL_TIMEZONE_OPTIONS.some((tz) => tz.value === currentValue)) {
    return TIMEZONE_REGIONS;
  }

  return [
    {
      region: 'Current',
      timezones: [{ value: currentValue, label: currentValue }],
    },
    ...TIMEZONE_REGIONS,
  ];
}
