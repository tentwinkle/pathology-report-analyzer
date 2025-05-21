export interface ORUResult {
  code: string
  name: string
  value: number | string
  units: string
  referenceRange: string
  date: string
}

export interface DiagnosticMetric {
  name: string
  oru_sonic_codes: string
  diagnostic: string
  diagnostic_groups: string
  oru_sonic_units: string
  units: string
  min_age: string
  max_age: string
  gender: string
  standard_lower: string
  standard_higher: string
  everlab_lower: string
  everlab_higher: string
}

export interface AbnormalResult extends ORUResult {
  metric: DiagnosticMetric
  isLow: boolean
  isHigh: boolean
  referenceRange: string
}
