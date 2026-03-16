export type DuesType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Union {
  id:                 string;
  companyId:          string;
  name:               string;
  code:               string;
  duesType:           DuesType;
  duesValue:          number;
  isActive:           boolean;
  description:        string | null;
  activeMembersCount?: number;
  createdAt:          string;
  updatedAt:          string;
}

export interface UnionMembership {
  id:         string;
  unionId:    string;
  employeeId: string;
  startDate:  string;
  endDate:    string | null;
  employee?:  {
    id:             string;
    firstName:      string;
    lastName:       string;
    documentNumber: string;
  };
  createdAt:  string;
  updatedAt:  string;
}

export interface UnionDashboard {
  totalActiveUnions:  number;
  totalActiveMembers: number;
  estimatedMonthlyCost: number;
  byUnion: Array<{
    unionId:       string;
    unionName:     string;
    unionCode:     string;
    duesType:      DuesType;
    duesValue:     number;
    activeMembers: number;
    estimatedCost: number;
  }>;
}
