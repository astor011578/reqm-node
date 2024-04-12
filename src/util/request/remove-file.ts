import path from 'path';
import fs from 'fs';
import { getEnv } from '@/util/env-variables';
const ENV = getEnv('NODE_ENV');
const ROOT_PATH = path.resolve(__dirname, '..');
const UPLOAD_PATH = ENV === 'prod' ? path.join(ROOT_PATH, '/public') : getEnv('UPLOAD_PATH_DEV');
let destination: string;

/**
 * @description 移除特定檔案
 * @param { string } dest: 檔案資料夾, 值可能為 'attached_files' 或 `${reqNo}/${step}` (e.g. 23010101/UAT1)
 * @param { string } fileName: 檔案名稱, 需要包含副檔名
 */
export default function (dest: string, fileName: string) {
  destination = dest;
  const filePath = `${UPLOAD_PATH}/${destination}/${fileName}`;
  fs.unlink(filePath, (error) => {
    if (error) {
      console.error(error);
      throw error;
    }
    console.log(`[Info] 刪除檔案 ${filePath} 成功`);
  });
}
