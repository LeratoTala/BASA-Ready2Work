export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export function reportCountDelta(
  before: ReportStatus | null,
  after: ReportStatus | null
): -1 | 0 | 1 {
  const wasPending = before === 'pending';
  const isPending = after === 'pending';

  if (wasPending === isPending) return 0;
  return isPending ? 1 : -1;
}
