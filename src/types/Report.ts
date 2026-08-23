export enum ReportReason {
  PATIENT_DATA = 'PATIENT_DATA',
  MEDICAL_MISINFORMATION = 'MEDICAL_MISINFORMATION',
  ADVERTISING = 'ADVERTISING',
  TITLE_IMPERSONATION = 'TITLE_IMPERSONATION',
  OTHER = 'OTHER',
}

export type CreateReportInput = {
  postId?: string;
  commentId?: string;
  reportedUserId?: string;
  reason: ReportReason;
  details?: string;
};
