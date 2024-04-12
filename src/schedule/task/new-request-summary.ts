import sumModel from '@/models/summary';
import { logger } from '@/util/schedule/info-logger';
import { getWeekString } from '@/util/request/week-string';
import { getDefaultSummay } from '@/util/request/summary-handler';

/**
 * @description 增加一筆 IT-requests weekly summary, 應在每個星期一執行
 */
export default async () => {
  const today = new Date();
  const week = await getWeekString(today);

  try {
    const _count = await getDefaultSummay();
    let doc = await sumModel.findOne({ week });

    if (doc) {
      await logger('週一新增 weekly summary', new Date(), 'Failed', `第 ${week} 週的 weekly summary 已存在`);

    } else {
      let newDoc = new sumModel(_count);
      newDoc.week = week;
      newDoc.startingDate = today;
      await newDoc.save();
      await logger('週一新增 weekly summary', new Date(), 'Success', `成功新增第 ${week} 週的 weekly summary`);
    }

  } catch (err) {
    console.error(err);
    await logger('週一新增 weekly summary', new Date(), 'Failed', err);
  }
};
