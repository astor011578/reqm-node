// import fs from 'fs';
// import { getEnv } from '@/util/env-variables';
// const ENV = getEnv('NODE_ENV');
// const LOG_PATH = ENV === 'prod' ? getEnv('LOG_PATH_PROD') : getEnv('LOG_PATH_DEV');

// /**
//  * @description 寫成 log 檔以紀錄排程任務的執行狀況
//  * @param { string } jobName : 排程任務名稱
//  * @param { Date } executeTime : 執行時間, 必須提供 Date 物件
//  * @param { string } status : 執行狀況, 'Success' || 'Failed'
//  * @param { any } message : Optional, 如果 status 為 Failed 則建議提供此參數
//  */
// export const logger = (jobName: string, executeTime: Date, status: string, message?: any) => {
//   try {
//     //1. 檢查伺服器上是否有 log 存放的資料夾
//     const isFolderExisted = fs.existsSync(LOG_PATH);
//     if (!isFolderExisted) fs.mkdirSync(LOG_PATH);

//     const today = new Date();
//     const fileName = [
//       today.getFullYear(),
//       today.getMonth() + 1 < 10 ? `0${today.getMonth() + 1}` : today.getMonth() + 1,
//       today.getDate() < 10 ? `0${today.getDate()}` : today.getDate(),
//       '.txt'
//     ].join('');

//     /**
//      * 換行符號:
//      * '\n' for POSIX
//      * '\r\n' for Windows
//      * 參考自: node.js os.EOL 項目
//      * https://nodejs.org/dist/latest-v12.x/docs/api/os.html#os_os_eol
//      */
//     let data = `
//       =====================================\r\n
//       任務名稱: ${jobName}\r\n
//       執行時間: ${getExecuteTime(executeTime)}\r\n
//       執行狀況: ${status}\r\n
//       補充訊息: ${message ? message : 'N/A'}\r\n
//       =====================================\r\n
//     `;

//     //如果路徑不存在檔案, fs.appendFile() 會直接創建ㄧ個檔案
//     //如果路徑已存在檔案, 會修改原檔
//     fs.appendFile(`${LOG_PATH}/${fileName}`, data, (err) => {
//       if (err) throw err;
//       console.log(`[Info] 新增 Log`);
//     });

//   } catch (err) {
//     console.error(err);
//   }
// };

// /**
//  * @description 取得任務的執行時間
//  * @param { Date } $date : 日期物件
//  */
// const getExecuteTime = ($date: Date) => {
//   function formatToTwoDigits(input: number) {
//     return input < 10 ? `0${input}` : input;
//   }

//   const dayArray = ['日', '一', '二', '三', '四', '五', '六'];
//   const year = $date.getFullYear();
//   const month = formatToTwoDigits($date.getMonth() + 1);
//   const date = formatToTwoDigits($date.getDate());
//   const hour = formatToTwoDigits($date.getHours());
//   const minute = formatToTwoDigits($date.getMinutes());
//   const second = formatToTwoDigits($date.getSeconds());
//   const day = dayArray[$date.getDay()];

//   return `${year}/${month}/${date} ${hour}:${minute}:${second} 星期${day}`;
// };
