// types/validation.ts
export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  summary?: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export type ValidationStatus = 'pending' | 'processing' | 'valid' | 'invalid';