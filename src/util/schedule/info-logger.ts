import logModel from '@/models/logs';
import { errorLogger } from '@/util/errors/error-logger';

/**
 * @description 將排程任務執行狀況記錄至 DB 中
 * @param { string } jobName : 排程任務名稱
 * @param { Date } executeTime : 執行時間, 必須提供 Date 物件
 * @param { string } status : 執行狀況, 'Success' || 'Failed'
 * @param { any } message : Optional, 如果 status 為 Failed 則建議提供此參數
 */
export const logger = async (jobName: string, executeTime: Date, status: string, message?: any) => {
  try {
    /**
     * 換行符號:
     * '\n' for POSIX
     * '\r\n' for Windows
     * 參考自: node.js os.EOL 項目
     * https://nodejs.org/dist/latest-v12.x/docs/api/os.html#os_os_eol
     */
    let info = `
      =====================================\r\n
      任務名稱: ${jobName}\r\n
      執行時間: ${getExecuteTime(executeTime)}\r\n
      執行狀況: ${status}\r\n
      補充訊息: ${message ? message : 'N/A'}\r\n
      =====================================\r\n
    `;
    await logModel.insertMany({
      type: 'info',
      info,
      timestamp: new Date(),
    });
    console.log(`[Info] 新增 Log`);

  } catch (err: any) {
    console.error(err);
    await errorLogger('src/util/schedule/info-logger.ts', err);
  }
};

/**
 * @description 取得任務的執行時間
 * @param { Date } $date : 日期物件
 */
const getExecuteTime = ($date: Date) => {
  function formatToTwoDigits(input: number) {
    return input < 10 ? `0${input}` : input;
  }

  const dayArray = ['日', '一', '二', '三', '四', '五', '六'];
  const year = $date.getFullYear();
  const month = formatToTwoDigits($date.getMonth() + 1);
  const date = formatToTwoDigits($date.getDate());
  const hour = formatToTwoDigits($date.getHours());
  const minute = formatToTwoDigits($date.getMinutes());
  const second = formatToTwoDigits($date.getSeconds());
  const day = dayArray[$date.getDay()];

  return `${year}/${month}/${date} ${hour}:${minute}:${second} 星期${day}`;
};
