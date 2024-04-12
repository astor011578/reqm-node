import reqModel from '@/models/request';
import { logger } from '@/util/schedule/info-logger';
import getAdminIds from '@/util/request/get-admin-ids';
import Mail from '@/mailer/mail';
import updateSummary from '@/util/request/summary-handler';

/**
 * @description 檢查是否有 delay 的需求, 會在每個星期五的 23:59:00 時啟動檢查
 * 需求具體內容:
 *  如果有人超過原訂的 expect date 還沒有 reschedule 或 upload evidence, 暫時沒事
 *  若是一直拖延到超過禮拜五還沒有採取行動, 才會被記一點 delay
 */
export default async () => {
  try {
    //1. 查詢目前所有狀態為 Proceeding 的需求
    const data = await reqModel.find({ status: 'Proceeding' });

    //2. 逐件檢查需求是否已過期
    //存放 delayed 的需求編號 (reqNo) 與當前步驟 (step)
    let delays: Array<{ reqNo: number, step: string; }> = [];

    if (data.length) {
      const message: string[] = [];
      for await (const doc of data) {
        //2-1. 獲取需求目前是卡在哪個步驟
        let step: string;
        switch ('Unuploaded') {
          case doc.uploadStatus?.UAT1: step = 'UAT1'; break;
          case doc.uploadStatus?.UAT2: step = 'UAT2'; break;
          case doc.uploadStatus?.release: step = 'release'; break;
          case doc.uploadStatus?.monitor: step = 'monitor'; break;
        }

        //2-2. 判斷需求是否已過期
        const lastExpDate = doc[`${step!}Logs`].expDates.slice(-1)[0];
        let isDue = isDueDate(lastExpDate);

        //2-3. 如果需求仍未被更新, 紀錄此需求的編號 (reqNo) 與當前步驟 (step)
        if (isDue) delays.push({ reqNo: doc.reqNo, step: step! });
      }
      message.push(`本次檢查結果: 有 ${delays.length} 件過期的需求`);

      let mailer = delays.length ? new Mail('reportDelay') : new Mail('reportNoDelay');
      let receiver = await getAdminIds();
      let info: any[] = [];

      //2-4. 更新計點
      if (delays.length) {
        for await (const delay of delays) {
          const { reqNo, step } = delay;
          let delayStep = delay.step;

          //2-4-1. 將計點記錄到這個已過期的需求上
          let delayDoc = await reqModel.findOne({ reqNo });
          const delayPoint = delayDoc!.KPI[step].delay;
          delayDoc!.KPI[step].delay = delayPoint ? delayPoint + 1 : 1;
          message.push(`#${reqNo} 現在的 delay 點數: ${delayDoc!.KPI[step].delay}`);

          //2-4-2. 將計點記錄到 weekly summary 中
          await updateSummary('delay', delayDoc!.reqTable.plant);

          //2-4-3. 將更改的內容記錄到此 doc 中
          await delayDoc!.save();

          info.push({ title: 'IT #', value: reqNo, isLink: true });
          info.push({ title: 'Stage', value: delayStep, isLink: false });
        }
      }
      await mailer.getEMails(receiver);
      await mailer.getHtml(info);
      await mailer.sendMail();
      message.push('本週的 delay 例行檢查結束');
      await logger('週五檢查 Delay 狀況', new Date(), 'Success', message);

    } else {
      await logger('週五檢查 Delay 狀況', new Date(), 'Success', '目前沒有需求需要被檢查');
    }

  } catch (err) {
    console.error(err);
    await logger('週五檢查 Delay 狀況', new Date(), 'Failed', err);
  }
};

/**
 * @description 判斷此需求是否已到期
 * @param { Date } expectDate: 預期完成的日期
 * @returns { boolean } 是否已到期
 */
const isDueDate = (expectDate: Date): boolean => {
  const today = new Date().getTime();
  const expectDatetime = expectDate.getTime();

  return expectDatetime - today <= 0 ? true : false;
};
