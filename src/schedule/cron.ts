import cron from 'node-cron';
import updateThisWeek from './task/update-thisWeek';
import newReqSummary from './task/new-request-summary';
import checkDelayReq from './task/check-delay-request';

export default async () => {
  /**
   * 設置定時排程任務, * * * * * * 六個 star 符號分別表示:
   * second (optional, 0-59)
   * minute (0-59)
   * hour (0-23)
   * date (1-31)
   * month (1-12, or names: Jan, Feb, March, April, ...etc. 縮寫或全名)
   * day of week (0-7, or names, 0 或 7 都是指 Sunday, 一樣也可使用縮寫或全名)
   * 若是設置五個 star 符號則表示預設 second 為 0
   */

  //每週一 00:00:30 執行
  cron.schedule('30 16 0 * * 0', async () => {
    //檢查並更新每個需求的 thisWeek 欄位
    await updateThisWeek();
    //新增當週的 weekly summary
    await newReqSummary();
  });

  //每週五 23:59:00 執行
  cron.schedule('59 15 * * 4', async () => {
    //檢查每個需求是否已過期, 過期會記點
    await checkDelayReq();
  });

  console.log('[Info] 定時排程任務');
};
