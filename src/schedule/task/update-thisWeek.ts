import reqModel from '@/models/request';
import { logger } from '@/util/schedule/info-logger';

/**
 * @description 檢查每條 IT-request 中 thisWeek 是否為 true, 應在每個星期一執行
 */
export default async () => {
  try {
    let data = await reqModel.find({});

    if (data.length) {
      const message: string[] = [];
      for await (const doc of data) {
        if (doc.thisWeek) {
          if (doc.status === 'Done' || doc.status === 'Cancel' || doc.status === 'Rejected') {
            doc.thisWeek = false;
            let updated = await doc.save();
            message.push(`更新 #${updated.reqNo} "thisWeek" 欄位\r\n`);
          }
        }
      }
      await logger('週一更新 thisWeek', new Date(), 'Success', message);

    } else {
      await logger('週一更新 thisWeek', new Date(), 'Success', '目前沒有需要更新的需求');
    }

  } catch (err) {
    console.error(err);
    await logger('週一更新 thisWeek', new Date(), 'Failed', err);
  }
};
