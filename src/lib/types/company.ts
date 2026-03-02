export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface Company {
  id:        string;
  name:      string;
  taxId:     string | null;
  address:   string | null;
  phone:     string | null;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id:        string;
  userId:    string;
  companyId: string;
  role:      CompanyRole;
  joinedAt:  string;
  invitedBy: string | null;
  user?:     Pick<import('./auth').User, 'id' | 'email' | 'name'>;
}
