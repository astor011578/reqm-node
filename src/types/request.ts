export type TRequest = {
  reqNo: number;
  reqrId: string;
  reqrName: string;
  pgrId: string;
  pgrName: string;
  issueDate: Date;
  thisWeek: boolean;
  status: 'Reviewing' | 'Returned' | 'Rejected' | 'Proceeding' | 'Done' | 'Cancel';
  reqTable: TReqTable;
  leadTime: number;
  attachedFiles?: Array<TUploadFile> | undefined;
  review?: TReviewValues | undefined;
  cancel?: TCancelValues | undefined;
  turnOnDate?: Date | undefined;
  type?: 'OneTime' | 'Project' | undefined;
  uploadStatus?: TUploadStatuses | undefined;
  KPI: {
    UAT1: TKpi | undefined;
    UAT2: TKpi | undefined;
    release?: TKpi | undefined;
    monitor?: TKpi | undefined;
  };
  UAT1Logs?: TBuyoffLogs | undefined;
  UAT2Logs?: TBuyoffLogs | undefined;
  releaseLogs?: TBuyoffLogs | undefined;
  monitorLogs?: TBuyoffLogs | undefined;
};

export type TReqTable = {
  reqName: string;
  plant: string;
  stage: string;
  customer: string;
  device: string;
  tester: string;
  equipment: string;
  system: string;
  purpose: string;
};

export type TReviewValues = {
  date: Date;
  comments?: string | undefined;
  result: 'Returned' | 'Rejected' | 'Approved';
};

export type TCancelValues = {
  applyDate: Date;
  applicantId: string;
  applicantName: string;
  reason: string;
  result: 'Reviewing' | 'Rejected' | 'Approved';
  reviewDate?: Date | undefined;
  comments?: string | undefined;
};

export type TUploadStatuses = {
  UAT1: 'Unuploaded' | 'Reviewing' | 'Approved' | 'Rejected';
  UAT2: 'Unuploaded' | 'Reviewing' | 'Approved' | 'Rejected';
  release?: 'Unuploaded' | 'Reviewing' | 'Approved' | 'Rejected';
  monitor?: 'Unuploaded' | 'Reviewing' | 'Approved' | 'Rejected';
};

export type TUploadFile = {
  fileName: string;
  originalName: string;
};

export type TKpi = {
  reschedule?: number | undefined;
  delay?: number | undefined;
};

export type TBuyoffLogs = {
  expDates: Array<Date>;
  actDate?: Date | undefined;
  //* 以下五個欄位如果有被重新上傳驗收證明, 會直接覆蓋前值
  updateDate?: Date | undefined;
  uploadFiles?: Array<TUploadFile> | undefined;
  result?: 'Reviewing' | 'Rejected' | 'Approved' | undefined;
  reviewDate?: Date | undefined;
  comments?: string | undefined;
};
