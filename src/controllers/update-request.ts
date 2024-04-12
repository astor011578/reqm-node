import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import { TUploadFile } from '~/request';
import { DataNotFoundError, CustomError } from '@/errors/index';
import reqModel from '@/models/request';
import validator from '@/util/validator/index';
import { dateFormatter } from '@/util/request/date-string';
import removeFile from '@/util/request/remove-file';
import getAdminIds from '@/util/request/get-admin-ids';
import updateSummary from '@/util/request/summary-handler';
import Mail from '@/mailer/mail';

/**
 * @description 此變數最主要是給寄信功能對照用, 帶入正確的 key 可帶出對應的 info 或 type
 * @key 等同於上方的變數 step (req.body.step)
 * @prop info: 對應 info 變數中的最後一個 item
 * @prop type: 對應 ../mailer/mail.js 中的 mapping 變數
 */
const mapping = {
  'UAT1': { info: 'UAT1', type: 'UAT1' },
  'UAT2': { info: 'UAT2', type: 'UAT2' },
  'release': { info: 'release', type: 'Release' },
  'monitor': { info: 'monitor 1 lot', type: 'Monitor' }
};

/**
 * @description 重新制定需求時程
 */
export const rescheduleReq = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 取得 reqNo
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值格式是否符合設計
    await validator(req.body['type'], 'type');
    await validator(req.body['UAT1'], 'UAT1');
    await validator(req.body['UAT2'], 'UAT2');
    const { type } = req.body;
    if (type && type === 'Project') {
      await validator(req.body['release'], 'release');
      await validator(req.body['monitor'], 'monitor');
    }

    //3. 依照 reqNo 至資料庫查詢單筆 request
    const doc = await reqModel.findOne({ reqNo });
    if (!doc) throw new DataNotFoundError(`reqNo #${reqNo}`);

    //4. 有查詢到資料, 開始處理延期的請求
    //4-1. 如果有傳值, 且此日期不與資料庫中同一欄位中最後一個日期重複
    const scheduleKeys = ['UAT1', 'UAT2', 'release', 'monitor'];
    for await (const key of scheduleKeys) {
      const value = req.body[key];
      const fieldName = `${key}Logs`;
      const compared = dateFormatter(doc[fieldName].expDates.slice(-1)[0], 'full');
      if (value && value !== compared) {
        //push new expect date into date array
        doc[fieldName].expDates.push(new Date(value));
        //the number of rescheduling times + 1
        const beforeRescheduling = doc.KPI[key].reschedule ? doc.KPI[key].reschedule : 0;
        doc.KPI[key].reschedule = beforeRescheduling + 1;
      }
    }

    //5. 儲存要修改的內容
    await doc.save();

    //6. send response to client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Re-schedule successfully'
    });

  } catch (err: CustomError | any) {
    console.error(err);
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 更新與上傳證明功能有關的欄位
 */
export const updateEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 取得 reqNo
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值格式是否符合設計
    await validator(req.body['step'], 'step');
    await validator(req.body['updateDate'], 'updateDate');
    await validator(req.body['uploadFiles'], 'uploadFiles');
    if (req.body['uploadFiles'] && req.body['uploadFiles'].length) {
      for await (const file of req.body['uploadFiles']) {
        const { fileName, originalName } = file;
        await validator(fileName, 'fileName');
        await validator(originalName, 'originalName');
      }
    }

    //3. 取得前端傳來的值
    const { step, updateDate, uploadFiles } = req.body;

    //4. 依照 reqNo 至資料庫查詢單筆 request
    const doc = await reqModel.findOne({ reqNo });
    if (!doc) throw new DataNotFoundError(`reqNo #${reqNo}`);

    //5. 有查詢到資料, 開始修改與上傳證明有關的欄位
    const key = `${step}Logs`;
    //5-1. 如果是被 rejected 後重新上傳, 需先清空先前上傳的資料
    while (doc[key].uploadFiles.length) {
      const removed = doc[key].uploadFiles.pop();
      removeFile(`${reqNo}/${step}`, removed.fileName);
    }
    //5-2. 開始修改各欄位值
    doc[key].updateDate = updateDate;
    doc[key].result = 'Reviewing';
    uploadFiles.forEach((file: TUploadFile) => {
      doc[key].uploadFiles.push(file);
    });
    doc.uploadStatus![step] = 'Reviewing';

    //6. 儲存要修改的內容
    const updated = await doc.save();

    //7. 寄送系統信給上傳者 & 審核者
    const info = [
      { title: 'ReqNo', value: updated.reqNo, isLink: true },
      { title: 'Request name', value: updated.reqTable.reqName, isLink: false },
      { title: 'Requester', value: updated.reqrName, isLink: false },
      { title: 'IT', value: updated.pgrName, isLink: false },
      { title: 'Type', value: updated.type, isLink: false },
      { title: 'Stage', value: mapping[step].info, isLink: false },
      { title: 'Status', value: 'Pending approval', isLink: false }
    ];
    //7-1. 寄送上傳成功通知給上傳者
    const uploader = step === 'UAT1' ? [doc.pgrId] : [doc.reqrId];
    const uploaderMailer = new Mail(`evidence${mapping[step].type}`);
    await uploaderMailer.getEMails(uploader);
    await uploaderMailer.getHtml(info);
    await uploaderMailer.sendMail();
    //7-2. 寄送提醒簽閱信件給審核者
    const approver = step === 'UAT1' ? [doc.reqrId] : [doc.pgrId];
    const approverMailer = new Mail('evidenceNotify');
    await approverMailer.getEMails(approver);
    await approverMailer.getHtml(info);
    await approverMailer.sendMail();

    //8. 回傳狀態碼 200 與成功訊息給 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Update successfully'
    });

  } catch (err: CustomError | any) {
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 簽閱上傳證明
 */
export const reviewEvidence = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 取得 reqNo
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值格式是否符合設計
    await validator(req.body['step'], 'step');
    await validator(req.body['reviewerReply'], 'reviewerReply');
    const reviewerReplyKeys = ['result', 'reviewDate'];
    for await (const key of reviewerReplyKeys) {
      const waitingValidate = req.body['reviewerReply'][key];
      await validator(waitingValidate, `reviewerReply.${key}`);
    }

    //3. 取得前端傳來的值
    const { step, reviewerReply } = req.body;
    const { result, reviewDate, comments } = reviewerReply;
    const field = `${step}Logs`;

    //4. 依照 reqNo 至資料庫查詢單筆 request
    const doc = await reqModel.findOne({ reqNo });
    if (!doc) throw new DataNotFoundError(`reqNo #${reqNo}`);

    //5. 有查詢到資料, 開始修改與簽閱結果有關的欄位
    const updateDate = doc[field].updateDate;
    doc[field].result = result;
    doc[field].reviewDate = reviewDate;
    if (comments) doc[field].comments = comments;
    const type = doc.type;
    const aboutToClose = (type === 'OneTime' && step === 'UAT2') || (type === 'Project' && step === 'monitor');

    //5-1. 事先處理與寄信功能相關的內容
    const receivers = [doc.pgrId, doc.reqrId];
    const infoAppend: any[] = [];   //如果有額外需要 push 進 info array 的資訊, 先暫存至此變數中
    let mailer: Mail;

    switch (result) {
      //5-2. 如果 Approved, 將 actual date 紀錄為 updateDate
      case 'Approved': {
        doc[field].actDate = updateDate;
        doc.uploadStatus![step] = 'Approved';
        //5-2-1. 如果準備要結案了
        if (aboutToClose) {
          //5-2-2. 更新 doc 的欄位
          const _start = doc.turnOnDate!.getTime();
          const _end = new Date(updateDate).getTime();
          const leadTime = (_end - _start) / (1000 * 3600 * 24);
          doc.leadTime = leadTime < 1 ? 0 : leadTime;
          doc.status = 'Done';
          doc.thisWeek = true;
          //5-2-3. 系統信設定
          infoAppend.push({ title: 'Status', value: 'done', isLink: false });
          mailer = new Mail('done');

          //5-2-4. 更新當週的 weekly summary
          await updateSummary('done', doc.reqTable.plant);

        } else {
          //5-3-1. 如果還沒有要結案, 發送簽閱通過通知信
          infoAppend.push({ title: 'Stage', value: mapping[step].info, isLink: false });
          infoAppend.push({ title: 'Status', value: 'Approved', isLink: false });
          mailer = new Mail(`evidenceApproved${mapping[step].type}`);
        }
        break;
      }
      //5-3. 如果 Rejected
      case 'Rejected': {
        //5-3-1. 更新 doc 的欄位
        doc.uploadStatus![step] = 'Rejected';
        //5-3-2. 發送簽閱不通過通知信
        infoAppend.push({ title: 'Stage', value: mapping[step].info, isLink: false });
        infoAppend.push({ title: 'Status', value: 'Rejected', isLink: false });
        mailer = new Mail(`evidenceRejected${mapping[step].type}`);
        break;
      }
    }

    //6. 儲存更改內容
    const updated = await doc.save();

    //7. 寄送系統信給上傳者與簽閱者
    let info = [
      { title: 'ReqNo', value: updated.reqNo, isLink: true },
      { title: 'Request name', value: updated.reqTable.reqName, isLink: false },
      { title: 'Requester', value: updated.reqrName, isLink: false },
      { title: 'IT', value: updated.pgrName, isLink: false },
      { title: 'Type', value: type, isLink: false }
    ];

    if (infoAppend.length) info = info.concat(infoAppend);
    await mailer!.getEMails(receivers);
    await mailer!.getHtml(info);
    await mailer!.sendMail();

    //8. 回傳 response 給 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Review uploaded evidence successfully'
    });

  } catch (err: CustomError | any) {
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 遞交需求取消申請
 */
export const applyCancellation = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 取得 reqNo
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值格式是否符合設計
    await validator(req.body['applyDate'], 'applyDate');
    await validator(req.body['applicantName'], 'applicantName');
    await validator(req.body['applicantId'], 'applicantId');

    //3. 取得前端傳來的值
    const { applyDate, applicantName, applicantId, reason } = req.body;

    //4. 依照 reqNo 至資料庫查詢單筆 request
    const doc = await reqModel.findOne({ reqNo });
    if (!doc) throw new DataNotFoundError(`reqNo #${reqNo}`);

    //5. 有查詢到資料, 開始修改與簽閱結果有關的欄位
    doc.cancel = {
      applyDate,
      applicantId,
      applicantName,
      reason,
      result: 'Reviewing'
    };

    //6. 儲存更改內容
    const updated = await doc.save();

    //7. 寄出系統信給申請者 & 審核者
    const applicants = [updated.reqrId, updated.pgrId];
    const reviewers = await getAdminIds();
    const info = [
      { title: 'ReqNo', value: updated.reqNo, isLink: true },
      { title: 'Request name', value: updated.reqTable.reqName, isLink: false },
      { title: 'Applicant', value: applicantName, isLink: false },
      { title: 'Application date', value: applyDate, isLink: false },
      { title: 'Reason', value: reason, isLink: false },
      { title: 'Status', value: 'Pending approval', isLink: false }
    ];

    const applicantMailer = new Mail('cancel');
    await applicantMailer.getEMails(applicants);
    await applicantMailer.getHtml(info);
    await applicantMailer.sendMail();

    const reviewerMailer = new Mail('cancelNotify');
    await reviewerMailer.getEMails(reviewers);
    await reviewerMailer.getHtml(info);
    await reviewerMailer.sendMail();

    //8. 回傳 response 給 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Apply cancellation successfully'
    });

  } catch (err: CustomError | any) {
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description review cancellation
 */
export const reviewCancellation = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 取得 reqNo
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值格式是否符合設計
    await validator(req.body['result'], 'result');

    //3. 取得前端傳來的值
    const { result, comments } = req.body;

    //4. 依照 reqNo 至資料庫查詢單筆 request
    const doc = await reqModel.findOne({ reqNo });
    if (!doc) throw new DataNotFoundError(`reqNo #${reqNo}`);

    //5. 有查詢到資料, 開始修改與簽閱結果有關的欄位
    const today = new Date();
    doc.cancel!.reviewDate = today;
    const infoAppend: any[] = [];   //暫存要 push 進 info array 的資料
    let notifyMailer: Mail;

    switch (result) {
      //5-1. 如果審核結果為 'Approved'
      case 'Approved': {
        //5-1-1. 修改相關欄位
        doc.cancel!.result = 'Approved';
        doc.status = 'Cancel';
        doc.thisWeek = true;
        //5-1-2. 寄送系統信設定
        infoAppend.push({ title: 'Status', value: 'Cancel', isLink: false });
        notifyMailer = new Mail('cancelApproved');
        //5-1-3. 更新 weekly summary 中 cancel 的數量
        await updateSummary('cancel', doc.reqTable.plant);
        break;
      }
      //5-2. 如果審核結果為 'Rejected'
      case 'Rejected': {
        //5-2-1. 修改相關欄位
        doc.cancel!.result = 'Rejected';
        if (comments) doc.cancel!.comments = comments;
        //5-2-2. 寄送系統信設定
        infoAppend.push({ title: 'Status', value: 'Cancellation is rejected', isLink: false });
        notifyMailer = new Mail('cancelRejected');
        break;
      }
    }

    //6. 儲存更改內容
    const updated = await doc.save();

    //7. 寄送系統信
    let info = [
      { title: 'ReqNo', value: updated.reqNo, isLink: true },
      { title: 'Request name', value: updated.reqTable.reqName, isLink: false },
      { title: 'Applicant', value: updated.cancel!.applicantName, isLink: false },
      { title: 'Application date', value: updated.cancel!.applyDate, isLink: false },
      { title: 'Reason of cancellation', value: updated.cancel!.reason, isLink: false },
    ];
    const adminIds = await getAdminIds();
    const receivers = [updated.pgrId, updated.reqrId].concat(adminIds);

    if (infoAppend.length) info = info.concat(infoAppend);

    await notifyMailer!.getEMails(receivers);
    await notifyMailer!.getHtml(info);
    await notifyMailer!.sendMail();

    //8. 回傳 response 給 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Review cancellation successfully'
    });

  } catch (err: CustomError | any) {
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};
