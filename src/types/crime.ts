export interface CrimeRecord {
  offense_id: string
  report_datetime: string
  offense_start_datetime: string
  offense_end_datetime?: string
  offense: string
  offense_parent_group: string
  crime_against_category: string
  group_a_b: string
  precinct: string
  sector: string
  beat: string
  mcpp: string
  _100_block_address: string
  longitude: string
  latitude: string
}

export interface CrimeFilters {
  offenseGroup: string
  dateRange: 'today' | 'week' | 'month' | '3months' | 'year' | 'all'
  precinct: string
}

export const OFFENSE_GROUPS = [
  'ALL',
  'ASSAULT OFFENSES',
  'BURGLARY/BREAKING&ENTERING',
  'DESTRUCTION/DAMAGE/VANDALISM OF PROPERTY',
  'DRUG/NARCOTIC OFFENSES',
  'LARCENY-THEFT',
  'MOTOR VEHICLE THEFT',
  'ROBBERY',
  'SEX OFFENSES',
  'TRESPASS OF REAL PROPERTY',
  'WEAPON LAW VIOLATIONS',
]

export const PRECINCTS = ['ALL', 'NORTH', 'EAST', 'SOUTH', 'SOUTHWEST', 'WEST']

export const DATE_RANGE_LABELS: Record<CrimeFilters['dateRange'], string> = {
  today: '今日',
  week: '過去7日間',
  month: '過去30日間',
  '3months': '過去3ヶ月',
  year: '過去1年',
  all: '全期間',
}
