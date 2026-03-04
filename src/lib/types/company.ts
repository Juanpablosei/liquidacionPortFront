export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface Company {
  id:        string;
  name:      string;
  taxId:     string | null;
  address:   string | null;
  phone:     string | null;
  isActive:  boolean;
  myRole?:   CompanyRole;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id:        string;
  userId:    string;
  companyId: string;
  role:      CompanyRole;
  name:      string;
  email:     string;
  joinedAt:  string;
  invitedBy: string | null;
}
