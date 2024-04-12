import { Document, model, Schema } from 'mongoose';
import { TRequest, TUploadFile } from '~/request';

export interface IRequest extends TRequest, Document { }

const reqSchema = new Schema({
  reqNo: { type: Number, required: true },
  reqrId: { type: String, required: true },
  reqrName: { type: String, required: true },
  pgrId: { type: String, required: true },
  pgrName: { type: String, required: true },
  thisWeek: { type: Boolean, required: true, default: true },
  issueDate: { type: Date, required: true, default: Date.now() },
  status: { type: String, required: true },
  reqTable: {
    reqName: { type: String, required: true },
    plant: { type: String, required: true },
    stage: { type: String, required: true },
    customer: { type: String, required: true },
    device: { type: String, required: true },
    tester: { type: String, required: true },
    equipment: { type: String, required: true },
    system: { type: String, required: true },
    purpose: { type: String, required: true }
  },
  leadTime: { type: Number, required: true, default: -1 }, //status 變 'Done' 以前值都是 -1
  attachedFiles: { type: Array }, //Array<{ fileName, originalName }>
  //* 以下欄位為被 IT 審核後才開始有值
  review: {
    date: { type: Date },
    comments: { type: String },
    result: { type: String }
  },
  //* 以下欄位為有提出取消申請後才開始有值
  cancel: {
    applyDate: { type: Date },
    applicantId: { type: String },
    applicantName: { type: String },
    reason: { type: String },
    result: { type: String },
    reviewDate: { type: Date },
    comments: { type: String }
  },
  //* 以下欄位為 "通過" IT 審核後才開始有值
  turnOnDate: { type: Date },
  type: { type: String },
  uploadStatus: {
    UAT1: { type: String },
    UAT2: { type: String },
    release: { type: String },
    monitor: { type: String }
  },
  KPI: {
    UAT1: { reschedule: { type: Number }, delay: { type: Number } },
    UAT2: { reschedule: { type: Number }, delay: { type: Number } },
    release: { reschedule: { type: Number }, delay: { type: Number } },
    monitor: { reschedule: { type: Number }, delay: { type: Number } }
  },
  UAT1Logs: {
    expDates: { type: Array<Date> },
    actDate: { type: Date },
    updateDate: { type: Date },
    uploadFiles: { type: Array<TUploadFile> },
    result: { type: String },
    reviewDate: { type: Date },
    comments: { type: String }
  },
  UAT2Logs: {
    expDates: { type: Array<Date> },
    actDate: { type: Date },
    updateDate: { type: Date },
    uploadFiles: { type: Array<TUploadFile> },
    result: { type: String },
    reviewDate: { type: Date },
    comments: { type: String }
  },
  releaseLogs: {
    expDates: { type: Array<Date> },
    actDate: { type: Date },
    updateDate: { type: Date },
    uploadFiles: { type: Array<TUploadFile> },
    result: { type: String },
    reviewDate: { type: Date },
    comments: { type: String }
  },
  monitorLogs: {
    expDates: { type: Array<Date> },
    actDate: { type: Date },
    updateDate: { type: Date },
    uploadFiles: { type: Array<TUploadFile> },
    result: { type: String },
    reviewDate: { type: Date },
    comments: { type: String }
  }
});

reqSchema.set('collection', 'requests');

const reqModel = model<IRequest>('requests', reqSchema);

export default reqModel;
