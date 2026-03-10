export function getSubscriptionStatusColor(status?: string): string {
  switch (status) {
    case 'ACTIVE':    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    case 'TRIAL':     return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    case 'PAST_DUE':  return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
    case 'BLOCKED':   return 'bg-red-500/15 text-red-400 border-red-500/20';
    case 'CANCELLED': return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    default:          return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
  }
}
