import fs from 'fs';
import { logger } from '@/util/schedule/info-logger';
import { getEnv } from '@/util/env-variables';
const ENV = getEnv('NODE_ENV');
const LOG_PATH = ENV === 'prod' ? getEnv('LOG_PATH_PROD') : getEnv('LOG_PATH_DEV');

/**
 * @description 每月 1 日執行此排程任務, 主要是將上個月的 log 檔移入該月份的資料夾中
 */
export default async () => {
  try {
    //1. 取得上個月的 log 資料夾
    const FOLDER_NAME = newFolder(new Date());
    const FOLDER_PATH = `${LOG_PATH}/${FOLDER_NAME}`;

    //2. 移動上個月的 log 檔案至此資料夾
    fs.readdir(LOG_PATH, async (err, files) => {
      for await (const file of files) {
        //2-1. 如果名稱含有此月份字串 (yyyymm)
        if (file.includes(FOLDER_NAME)) {
          const OLD_PATH = `${LOG_PATH}/${file}`;
          //2-2. 檢查此檔案為資料夾還是檔案
          fs.stat(OLD_PATH, (err, stat) => {
            if (err) throw err;
            const isDirectory = stat.isDirectory();
            //2-3. 如果不為資料夾, 則移動此檔案的位置
            if (!isDirectory) {
              fs.rename(OLD_PATH, `${FOLDER_PATH}/${file}`, (err) => {
                if (err) throw err;
              });
            }
          });
        }
      }
    });
    await logger('每月一號移動 log 檔案', new Date(), 'Success', '整理 log 檔案完畢');

  } catch (err) {
    console.error(err);
    await logger('每月一號移動 log 檔案', new Date(), 'Failed', err);
  }
};

const newFolder = (today: Date): string => {
  //取得資料夾名稱 (資料夾名稱為上一個月份字串 'yyyymm')
  const month = today.getMonth() + 1 - 1 === 0 ? 12 : today.getMonth() + 1 - 1;
  const year = month === 12 ? today.getFullYear() - 1 : today.getFullYear();
  const FOLDER_NAME = [
    year,
    month < 10 ? `0${month}` : month
  ].join('');
  const FOLDER_PATH = `${LOG_PATH}/${FOLDER_NAME}`;

  //判斷資料夾是否已存在
  const isFolderExisted = fs.existsSync(FOLDER_PATH);

  //如果資料夾不存在, 則創建資料夾
  if (!isFolderExisted) {
    fs.mkdir(FOLDER_PATH, (err) => {
      if (err) throw err;
      console.log('[Info] 創建 log 資料夾');
    });
  }

  //回傳資料夾路徑
  return FOLDER_NAME;
};
