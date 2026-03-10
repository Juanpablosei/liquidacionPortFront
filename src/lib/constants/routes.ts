export const ROUTES = {
  login:          '/login',
  register:       '/register',
  forgotPassword: '/forgot-password',
  resetPassword:  '/reset-password',
  confirmEmail:   '/confirm-email',
  companies:      '/companies',
  newCompany:     '/companies/new',
  profile:        '/profile',

  company:        (id: string) => `/companies/${id}`,
  companyMembers: (id: string) => `/companies/${id}/members`,
  companySettings:(id: string) => `/companies/${id}/settings`,

  employees:      (cid: string) => `/companies/${cid}/employees`,
  newEmployee:    (cid: string) => `/companies/${cid}/employees/new`,
  employee:       (cid: string, eid: string) => `/companies/${cid}/employees/${eid}`,

  attendance:     (cid: string) => `/companies/${cid}/attendance`,
  overtime:       (cid: string) => `/companies/${cid}/overtime`,
  holidays:       (cid: string) => `/companies/${cid}/holidays`,
  concepts:       (cid: string) => `/companies/${cid}/concepts`,
  payroll:        (cid: string) => `/companies/${cid}/payroll`,
  payslips:       (cid: string) => `/companies/${cid}/payslips`,
  payrollRun:     (cid: string, rid: string) => `/companies/${cid}/payroll/runs/${rid}`,
  myPayslips:     (cid: string) => `/companies/${cid}/my-payslips`,
  myPayslip:      (cid: string, pid: string) => `/companies/${cid}/my-payslips/${pid}`,
  convenios:      (cid: string) => `/companies/${cid}/convenios`,

  // Admin routes
  admin:              '/admin',
  adminConvenios:     '/admin/convenios',
  adminPlans:         '/admin/plans',
  adminSubscriptions: '/admin/subscriptions',
  adminSubscription:  (id: string) => `/admin/subscriptions/${id}`,
  adminCompanies:     '/admin/companies',
} as const;
