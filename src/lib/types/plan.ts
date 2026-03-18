export interface PlanLimitError {
  statusCode: 403;
  message: string;
  planCode: string;
  currentUsage: number;
  maxAllowed: number;
}

export interface PlanFeatureError {
  statusCode: 403;
  message: string;
  feature: string;
  planCode: string;
}

export type PlanFeatureFlag =
  | 'exportPdf'
  | 'unions'
  | 'formulas'
  | 'aiUpload';

export interface PlanFeatures {
  exportPdf: boolean;
  unions: boolean;
  formulas: boolean;
  aiUpload: boolean;
}
