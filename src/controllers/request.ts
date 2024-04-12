import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import { TRequest } from '~/request';
import { ValidationError, DataNotFoundError, CustomError } from '@/errors/index';
import reqModel, { IRequest } from '@/models/request';
import userModel from '@/models/user';
import validator from '@/util/validator/index';
import getReqNo from '@/util/request/request-number';
import removeFile from '@/util/request/remove-file';
import { dateFormatter } from '@/util/request/date-string';
import updateSummary from '@/util/request/summary-handler';
import Mail from '@/mailer/mail';

/**
 * @description 新增一筆新需求
 */
export const newReq = async (req: Request, res: Response): Promise<void> => {
  const today = new Date();

  try {
    //1. 取得 reqNo
    const reqNo = await getReqNo();
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值的格式是否合乎設計
    //2-1. 先驗證最外層的值
    const outterKeys = ['coreTeam', 'reqTable'];
    for await (const outterKey of outterKeys) {
      await validator(req.body[outterKey], outterKey);
      switch (outterKey) {
        case 'coreTeam': {
          await validator(req.body.coreTeam.reqr.id, 'coreTeam.reqr.id');
          await validator(req.body.coreTeam.reqr.name, 'coreTeam.reqr.name');
          await validator(req.body.coreTeam.pgr.id, 'coreTeam.pgr.id');
          await validator(req.body.coreTeam.pgr.name, 'coreTeam.pgr.name');
          break;
        }
        case 'reqTable': {
          const reqTableKeys = ['reqName', 'plant', 'stage', 'customer', 'device', 'tester', 'equipment', 'system', 'purpose'];
          for await (const reqTableKey of reqTableKeys) {
            const pendingValidation = req.body['reqTable'][reqTableKey];
            await validator(pendingValidation, `reqTable.${reqTableKey}`);
          }
          break;
        }
        default: {
          break;
        }
      }
    }
    //2-2. 如果有傳 attachedFiles 的值, 則檢查是否不為空陣列
    let attachedFiles: TRequest['attachedFiles'];
    if (req.body['attachedFiles']) {
      if (!Array.isArray(req.body['attachedFiles'])) {
        throw new ValidationError('attachedFiles must be an array');
      } else {
        attachedFiles = req.body['attachedFiles'].length === 0 ? undefined : req.body['attachedFiles'];
      }
    }

    //3. 取得前端傳送過來的值
    const { coreTeam, reqTable } = req.body;
    const reqrId: TRequest['reqrId'] = coreTeam['reqr']['id'];
    const reqrName: TRequest['reqrName'] = coreTeam['reqr']['name'];
    const pgrId: TRequest['pgrId'] = coreTeam['pgr']['id'];
    const pgrName: TRequest['pgrName'] = coreTeam['pgr']['name'];

    //4. 建立新的 IT-request
    const newRequest: IRequest = new reqModel({
      reqNo,
      reqrId,
      reqrName,
      pgrId,
      pgrName,
      thisWeek: true,
      issueDate: today,
      status: 'Reviewing',
      reqTable,
      leadTime: -1
    });
    if (attachedFiles) newRequest.attachedFiles = attachedFiles;

    //5. 更新當週的結報
    await updateSummary('reviewing', reqTable.plant);

    //6. 將要新增的 IT-request 資料存入資料庫中
    const requestDoc = await newRequest.save();

    //7. send e-mail to requester & IT
    const info = [
      { title: 'ReqNo', value: reqNo, isLink: true },
      { title: 'Request name', value: reqTable.reqName },
      { title: 'Requester', value: reqrName },
      { title: 'IT', value: pgrName },
      { title: 'Status', value: 'Reviewing' }
    ];
    const newMailer = new Mail('new');
    await newMailer.getEMails([reqrId]);
    await newMailer.getHtml(info);
    await newMailer.sendMail();
    const newNotifyMailer = new Mail('newNotify');
    await newNotifyMailer.getEMails([pgrId]);
    await newNotifyMailer.getHtml(info);
    await newNotifyMailer.sendMail();

    //8. 傳回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Adding request #${requestDoc.reqNo} successfully`
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
 * @description 簽閱一筆新需求
 */
export const revReq = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 先檢查 reqNo 是否為 null | undefined 或 empty string
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 驗證前端傳值的格式是否合乎設計
    //2-1. 先驗證最外層的值
    const outterKeys = ['result', 'message', 'type', 'schedule'];
    for await (const outterKey of outterKeys) {
      //2-2. 如果檢驗到的 key 為 'review' 或 'schedule'，則需要檢查其內層的值
      const result = req.body['result'];
      switch (outterKey) {
        case 'result': {
          await validator(result, 'result');
          break;
        }
        case 'schedule': {
          if (result === 'Approved') {
            await validator(req.body['schedule'], 'schedule');
            const basicKeys = ['turnOnDate', 'UAT1', 'UAT2'];
            const projectKeys = ['release', 'monitor'];
            const scheduleKeys = req.body['type'] === 'OneTime' ? basicKeys : basicKeys.concat(projectKeys);
            for await (const scheduleKey of scheduleKeys) {
              const pendingValidation = req.body['schedule'][scheduleKey];
              await validator(pendingValidation, `schedule.${scheduleKey}`);
            }
          }
          break;
        }
        case 'type': {
          if (result === 'Approved') await validator(req.body['type'], 'type');
          break;
        }
        case 'message': {
          if (result === 'Rejected') await validator(req.body['message'], 'message');
          break;
        }
        default: {
          break;
        }
      }
    }

    //3. 查詢此 request
    const request = await reqModel.findOne({ reqNo });
    if (!request) throw new DataNotFoundError(`reqNo ${reqNo}`);

    //4. 修改部分欄位資訊
    const { result, type, message, schedule } = req.body;
    switch (result) {
      case 'Approved': {
        const UAT1 = new Date(schedule.UAT1);
        const UAT2 = new Date(schedule.UAT2);
        request.type = type;
        request.turnOnDate = schedule.turnOnDate;
        request['UAT1Logs']!['expDates'] = [UAT1];
        request['UAT2Logs']!['expDates'] = [UAT2];
        request.uploadStatus = {
          UAT1: 'Unuploaded',
          UAT2: 'Unuploaded'
        };
        if (type === 'Project') {
          const release = new Date(schedule.release);
          const monitor = new Date(schedule.monitor);
          request['releaseLogs']!['expDates'] = [release];
          request['monitorLogs']!['expDates'] = [monitor];
          request.uploadStatus['release'] = 'Unuploaded';
          request.uploadStatus['monitor'] = 'Unuploaded';
        }
        request.status = 'Proceeding';
        break;
      }
      case 'Rejected':
      case 'Returned': {
        request.status = result;
        if (message) request.review!.comments = message;
        break;
      }
    }
    request.review!.date = new Date();
    request.review!.result = result;
    request.thisWeek = true;

    //5. 更新當週 request 週報
    switch (result) {
      case 'Approved': await updateSummary('prcd', request.reqTable.plant); break;
      case 'Rejected': await updateSummary('rejected', request.reqTable.plant); break;
    }

    //6. 將修改的資訊存入資料庫
    const requestDoc = await request.save();

    //7. 寄發系統信給 requester 與 IT
    const info = [
      { title: 'ReqNo', value: reqNo, isLink: true },
      { title: 'Request name', value: requestDoc.reqTable.reqName },
      { title: 'Requester', value: requestDoc.reqrName },
      { title: 'IT', value: requestDoc.pgrName },
      { title: 'Status', value: result }
    ];
    const reviewMailer = new Mail(`new${result}`);
    await reviewMailer.getEMails([requestDoc.reqrId]);
    await reviewMailer.getHtml(info);
    await reviewMailer.sendMail();

    //8. 傳回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Review Request #${requestDoc.reqNo} successfully`
    });

  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 修改一筆新需求
 */
export const editReq = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 先檢查 reqNo 是否為 null | undefined 或 empty string
    const reqNo = req.params.reqNo;
    await validator(reqNo, 'reqNo');

    //2. 查詢此 request
    const request = await reqModel.findOne({ reqNo });
    if (!request) throw new DataNotFoundError(`reqNo ${reqNo}`);

    //3. 驗證前端傳值的格式是否合乎設計
    //3-1. 先驗證最外層的值
    const outterKeys = ['coreTeam', 'reqTable'];
    for await (const outterKey of outterKeys) {
      await validator(req.body[outterKey], outterKey);
      switch (outterKey) {
        case 'coreTeam': {
          await validator(req.body.coreTeam.reqr.id, 'coreTeam.reqr.id');
          await validator(req.body.coreTeam.reqr.name, 'coreTeam.reqr.name');
          await validator(req.body.coreTeam.pgr.id, 'coreTeam.pgr.id');
          await validator(req.body.coreTeam.pgr.name, 'coreTeam.pgr.name');
          break;
        }
        case 'reqTable': {
          const reqTableKeys = ['reqName', 'plant', 'stage', 'customer', 'device', 'tester', 'equipment', 'system', 'purpose'];
          for await (const reqTableKey of reqTableKeys) {
            const pendingValidation = req.body['reqTable'][reqTableKey];
            await validator(pendingValidation, `reqTable.${reqTableKey}`);
          }
          break;
        }
        default: {
          break;
        }
      }
    }
    //3-2. 如果有傳 attachedFiles 的值, 則檢查是否不為空陣列
    let attachedFiles: TRequest['attachedFiles'];
    if (req.body['attachedFiles']) {
      if (!Array.isArray(req.body['attachedFiles'])) {
        throw new ValidationError('attachedFiles must be an array');
      } else {
        attachedFiles = req.body['attachedFiles'].length === 0 ? undefined : req.body['attachedFiles'];
      }
    }

    //4. 取得前端傳送過來的值
    const { coreTeam, reqTable } = req.body;
    const pgrId: TRequest['pgrId'] = coreTeam['pgr']['id'];
    const pgrName: TRequest['pgrName'] = coreTeam['pgr']['name'];

    //5. 更新當週 request 週報數量
    await updateSummary('reviewing', request.reqTable.plant);

    //6. 儲存要修改的內容
    request.pgrId = pgrId;
    request.pgrName = pgrName;
    request.reqTable = reqTable;
    request.thisWeek = true;
    request.status = 'Reviewing';

    //7. 如果前端有傳入新的 attachedFiles, 覆蓋前值, 並將舊的附件從伺服器刪除
    const oldAttachedFiles = request.attachedFiles;
    if (attachedFiles) {
      if (oldAttachedFiles) {
        for await (const file of oldAttachedFiles) {
          const { fileName } = file;
          removeFile('attached_files', fileName);
        }
      }
      request.attachedFiles = attachedFiles;
    }
    const requestDoc = await request.save();

    //8. 寄送系統信給需求者與 IT
    const info = [
      { title: 'ReqNo', value: reqNo, isLink: true },
      { title: 'Request name', value: reqTable.reqName },
      { title: 'Requester', value: requestDoc.reqrName },
      { title: 'IT', value: pgrName },
      { title: 'Status', value: 'Reviewing' }
    ];
    const editMailer = new Mail('edit');
    await editMailer.getEMails([requestDoc.reqrId]);
    await editMailer.getHtml(info);
    await editMailer.sendMail();
    const editNotifyMailer = new Mail('editNotify');
    await editNotifyMailer.getEMails([pgrId]);
    await editNotifyMailer.getHtml(info);
    await editNotifyMailer.sendMail();

    //9. 傳回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Edit request #${requestDoc.reqNo} successfully`
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
 * @description 依 reqNo 找單筆需求
 */
export const getByReqNo = async (req: Request, res: Response): Promise<void> => {
  const reqNo = req.params.reqNo;

  try {
    await validator(reqNo, 'reqNo');

    //1. 依照 reqNo 到資料庫中尋找此筆資料
    const request = await reqModel.findOne({ reqNo });

    //2. 如果沒有此筆資料, 拋出 error 至 catch 區塊
    if (!request) throw new DataNotFoundError(`reqNo ${reqNo}`);

    //3-1. 如果有此筆資料, 先調整資料內容
    const modified = {
      reqNo: request.reqNo,
      reqrId: request.reqrId,
      reqrName: request.reqrName,
      pgrId: request.pgrId,
      pgrName: request.pgrName,
      issueDate: request.issueDate,
      status: request.status,
      reqTable: request.reqTable,
      review: request.review,
      cancel: request.cancel,
      turnOnDate: request.turnOnDate,
      type: request.type,
      uploadStatus: request.uploadStatus,
      KPI: request.KPI,
      UAT1Logs: request.UAT1Logs,
      UAT2Logs: request.UAT2Logs,
      releaseLogs: request.releaseLogs,
      monitorLogs: request.monitorLogs,
      attachedFiles: request.attachedFiles ? request.attachedFiles : [],
      leadTime: -1,
      reviewDuration: -1
    };

    //3-2. 調整 leadTime 的值
    switch (request.status) {
      case 'Proceeding':
        modified.leadTime = await getLeadTime(request.turnOnDate!);
        break;
      case 'Cancel':
        modified.leadTime = await getLeadTime(request.turnOnDate!, request.cancel!.applyDate);
        break;
      case 'Done':
        modified.leadTime = request.leadTime;
        break;
      case 'Rejected':
      case 'Reviewing':
      case 'Returned': {
        modified.leadTime = -1;
        break;
      }
    }

    //3-3. 調整 reviewDuration 的值
    switch (request.status) {
      case 'Proceeding':
      case 'Cancel':
      case 'Done': {
        modified.reviewDuration = modified.review!.date ? await getLeadTime(modified.issueDate, modified.review!.date) : 0;
        break;
      }
      case 'Rejected':
        modified.reviewDuration = await getLeadTime(modified.issueDate, modified.review!.date);
        break;
      case 'Reviewing':
      case 'Returned': {
        modified.reviewDuration = await getLeadTime(modified.issueDate);
        break;
      }
    }

    //4. 調整完畢後將 response 送回 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Get Request #${reqNo} data successfully`,
      data: modified
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
 * @description 取得多筆需求 (如果需要依照狀態查詢, 請加上 req.query.status)
 */
export const getByStatus = async (req: Request, res: Response): Promise<void> => {
  //要用什麼狀態來篩選資料
  const status = req.query.status?.toString();
  let query = {};

  if (status) {
    switch (status) {
      case 'Weekly':
        query = { thisWeek: true };
        break;
      case 'Reviewing':
        query = { $or: [{ status: 'Returned' }, { status: 'Reviewing' }] };
        break;
      default:
        query = { status };
        break;
    }
  }

  try {
    //1. query 出符合條件的資料
    const requests = await reqModel.find(query);

    //2. 如果有資料, 開始修改要傳回前端的資料
    const modifieds: any[] = [];
    if (requests?.length) {
      /**
       * @description 判斷需求是否已過期未更新
       * @param { Date } exp 該驗收階段的 expect date
       * @param { Date } act 該驗收階段的 actual date
       * @returns { boolean }
       */
      const isOverDueTime = (exp: Date[], act: Date): boolean => {
        if (exp.length && !act) {
          const _exp = exp.pop();
          if (_exp) {
            const EXP_DATETIME = new Date(_exp).getTime();
            const TODAY = new Date().getTime();
            const ONE_DATETIME = 1000 * 3600 * 24;
            return (EXP_DATETIME - TODAY) / ONE_DATETIME <= 1 ? true : false;
          }
          return false;
        }
        return false;
      };

      for await (const request of requests) {
        //3-1. 修改延期次數的值
        //IT 延期次數
        const rescheduleIT = request.KPI.UAT1?.reschedule ? request.KPI.UAT1.reschedule : 0;
        //需求者延期次數
        let rescheduleReqr = request.KPI.UAT2?.reschedule ? request.KPI.UAT2.reschedule : 0;
        if (request.type === 'Project') {
          rescheduleReqr += request.KPI.release?.reschedule ? request.KPI.release.reschedule : 0;
          rescheduleReqr += request.KPI.monitor?.reschedule ? request.KPI.monitor.reschedule : 0;
        }

        //3-2. 獲取 buyoffStatus 的值
        let buyoffStatus: string;
        if (request.status === 'Proceeding') {
          const uploadStatus = request?.uploadStatus;
          switch (true) {
            case uploadStatus && uploadStatus.UAT1 !== 'Approved': {
              buyoffStatus = 'Wait UAT1';
              break;
            }
            case uploadStatus && uploadStatus.UAT2 !== 'Approved': {
              buyoffStatus = 'Wait UAT2';
              break;
            }
            case uploadStatus && uploadStatus.release !== 'Approved': {
              buyoffStatus = 'Wait release';
              break;
            }
            case uploadStatus && uploadStatus.monitor !== 'Approved': {
              buyoffStatus = 'Wait monitor 1 lot';
              break;
            }
            default: {
              buyoffStatus = 'Done';
              break;
            }
          }
        } else {
          buyoffStatus = request.status;
        }

        //3-3. 其他要傳回前端的值
        const modified: any = {
          reqNo: request.reqNo,
          rescheduleIT,
          rescheduleReqr,
          reqName: request.reqTable.reqName,
          type: request.type,
          plant: request.reqTable.plant,
          reqr: request.reqrName,
          pgr: request.pgrName,
          approveDate: dateFormatter(request.review!.date, 'full'),
          issueDate: dateFormatter(request.issueDate, 'full'),
          turnOnDate: dateFormatter(request.turnOnDate, 'no-year'),
          UAT1Exp: dateFormatter(request.UAT1Logs!.expDates, 'no-year'),
          UAT1Act: dateFormatter(request.UAT1Logs!.actDate, 'no-year'),
          UAT1IsDue: isOverDueTime(request.UAT1Logs!.expDates, request.UAT1Logs!.actDate!),
          UAT2Exp: dateFormatter(request.UAT2Logs!.expDates, 'no-year'),
          UAT2Act: dateFormatter(request.UAT2Logs!.actDate, 'no-year'),
          UAT2IsDue: isOverDueTime(request.UAT2Logs!.expDates, request.UAT2Logs!.actDate!),
          releaseExp: dateFormatter(request.releaseLogs!.expDates, 'no-year'),
          releaseAct: dateFormatter(request.releaseLogs!.actDate, 'no-year'),
          releaseIsDue: isOverDueTime(request.releaseLogs!.expDates, request.releaseLogs!.actDate!),
          monitorExp: dateFormatter(request.monitorLogs!.expDates, 'no-year'),
          monitorAct: dateFormatter(request.monitorLogs!.actDate, 'no-year'),
          monitorIsDue: isOverDueTime(request.monitorLogs!.expDates, request.monitorLogs!.actDate!),
          buyoffStatus,
          status: request.status,
          cancelDate: request.status === 'Cancel' ? dateFormatter(request.cancel?.applyDate, 'full') : null,
          thisWeek: request.thisWeek
        };
        const today = dateFormatter(new Date(), 'full');

        //3-3. 當需求狀態為 'Done' | 'Cancel' | 'Rejected' 時, 判斷其是否在今天結案
        if (request.status === 'Done') {
          switch (request.type) {
            case 'OneTime': {
              const reviewDateUAT2 = dateFormatter(request.UAT2Logs?.reviewDate, 'full');
              modified.doneOnToday = reviewDateUAT2 === today ? true : false;
              break;
            }
            case 'Project': {
              const reviewDateMonitor = dateFormatter(request.monitorLogs?.reviewDate, 'full');
              modified.doneOnToday = reviewDateMonitor === today ? true : false;
              break;
            }
          }
        } else if (request.status === 'Cancel') {
          const reviewDateCancel = dateFormatter(request.cancel?.reviewDate, 'full');
          modified.cancelOnToday = reviewDateCancel === today ? true : false;
        } else if (request.status === 'Rejected') {
          const reviewDateRejected = dateFormatter(request.review?.date, 'full');
          modified.rejectedOnToday = reviewDateRejected === today ? true : false;
        } else {
          modified.newOnToday = dateFormatter(request.issueDate, 'full') === today ? true : false;
        }

        //3-4. 修改 leadTime 的值
        if (request.leadTime === -1) {
          switch (request.status) {
            case 'Proceeding':
              modified.leadTime = await getLeadTime(request.turnOnDate!);
              break;
            case 'Cancel':
              modified.leadTime = await getLeadTime(request.turnOnDate!, request.cancel?.applyDate);
              break;
            case 'Reviewing':
            case 'Returned':
            case 'Rejected': {
              modified.leadTime = -1;
              break;
            }
          }
        } else {
          modified.leadTime = request.leadTime;
        }

        //3-5. 修改 reviewDuration 的值
        switch (request.status) {
          case 'Rejected':
            modified.reviewDuration = await getLeadTime(request.issueDate, request.review?.date);
            break;
          case 'Returned':
          case 'Reviewing': {
            modified.reviewDuration = await getLeadTime(request.issueDate);
            break;
          }
          default:
            modified.reviewDuration = 0;
            break;
        }

        //3-6. 將修改完畢的需求資料存至 modifieds array 中
        modifieds.push(modified);
      }
    }

    //4. 傳回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Get ${status ? status.toLowerCase() : 'all'} requests successfully`,
      data: modifieds
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
 * @description 取得等待被簽閱的需求 (Reviewing, Applying for cancellation, ...etc.)
 */
export const getPendings = async (req: Request, res: Response): Promise<void> => {
  const reviewerId = req.params.reviewerId.trim();
  const status = req.query.status;

  try {
    //1. 檢查前端夾帶的資料格式是否有誤
    await validator(reviewerId, 'reviewerId');

    //2. 取得簽閱者資訊 (reviewer)
    const reviewer = await userModel.findOne({ userId: reviewerId });
    if (!reviewer) throw new DataNotFoundError(`user ${reviewerId}`);
    const isAdmin = reviewer ? reviewer.roles.includes('Administrator') : false;

    //3. 取得查詢資料庫的 query
    let query: any;
    switch (status) {
      case 'total': query = { $or: [{ 'cancel.result': 'Reviewing' }, { status: 'Reviewing' }] }; break;
      case 'reviewing': query = isAdmin ? { status: 'Reviewing' } : { status: 'Reviewing', pgrId: { $in: [reviewerId] } }; break;
      case 'cancelling': query = { 'cancel.result': 'Reviewing' }; break;
      default: query = undefined; break;
    }

    //4. 取得符合 query 的資料
    const data = query ? await reqModel.find(query) : [];

    //5. 回傳給 client 前先修改格式
    const pendings: any[] = [];
    for await (const doc of data) {
      const modified: any = {
        reqNo: doc.reqNo,
        reqName: doc.reqTable.reqName,
        type: doc.type
      };
      //遞交取消申請的需求
      if (doc.status === 'Proceeding') {
        modified.category = 'Cancellation';
        modified.recipient = [reviewer?.nameEn, reviewer?.userId];
        modified.applyDate = dateFormatter(doc.cancel?.applyDate, 'full');
        modified.applicant = doc.cancel?.applicantName;
        modified.reason = doc.cancel?.reason;
        modified.role = doc.pgrId === doc.cancel?.applicantId ? 'IT' : 'Requester';
        pendings.push(modified);
      }
      //等待簽閱的新需求
      if (doc.status === 'Reviewing') {
        modified.category = 'Reviewing';
        modified.recipient = [doc.pgrName, doc.pgrId];
        modified.applyDate = dateFormatter(doc.issueDate, 'full');
        modified.applicant = doc.reqrName;
        pendings.push(modified);
      }
    }

    //6. 回傳 response 給 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: pendings.length ? pendings : [],
      message: pendings.length ? null : "Thers's no data pending approval",
    });

  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description to get lead time (turnOnDate - last update date)
 * @param { Date } sDate start date (It will be turnOnDate in requests)
 * @param { Date } eDate end date
 * @returns { number } the number that eDate minus sDate left
 */
const getLeadTime = async (sDate: Date, eDate?: Date): Promise<number> => {
  const sDatetime = sDate.getTime();
  //Proceeding: 用預設值今日去計算
  //Cancel: 用取消申請的日期去計算
  const eDatetime = eDate ? eDate.getTime() : new Date().getTime();
  const leftDates = Math.floor((eDatetime - sDatetime) / (1000 * 3600 * 24));
  return leftDates >= 0 ? leftDates : -1;
};
