import type { Application, WorkRecord } from './types';

export interface PilotMetrics {
  applicationRecords: number;
  currentlyShortlisted: number;
  completedWorkRecords: number;
  employerReportedPayouts: number;
}

export function calculatePilotMetrics(
  applications: readonly Pick<Application, 'status'>[],
  workRecords: readonly Pick<WorkRecord, 'completionStatus' | 'payoutConfirmed'>[]
): PilotMetrics {
  return {
    applicationRecords: applications.length,
    currentlyShortlisted: applications.filter((application) => application.status === 'shortlisted').length,
    completedWorkRecords: workRecords.filter((record) => record.completionStatus === 'completed').length,
    employerReportedPayouts: workRecords.filter(
      (record) => record.completionStatus === 'completed' && record.payoutConfirmed
    ).length,
  };
}
