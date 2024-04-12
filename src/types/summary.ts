export type TSummary = {
  week: string;       //第幾週 (格式為 yyyymm)
  startingDate: Date; //每週的起算日 (禮拜一)
  total: number;      //總共幾件需求
  reviewing: number;  //審核中需求件數
  prcd: number;       //進行中需求件數
  done: number;       //完成需求件數
  cancel: number;     //取消需求件數
  delay: number;      //過期需求件數
  rejected: number;   //被退件需求件數
  /** P1~P3 個別工廠所提出的件數統計數據 */
  P1: TBasicSummary;
  P2: TBasicSummary;
  P3: TBasicSummary;
};

export type TBasicSummary = {
  total: number;
  reviewing: number;
  prcd: number;
  done: number;
  cancel: number;
  delay: number;
  rejected: number;
};
