import { Document, model, Schema } from 'mongoose';
import { TSummary } from '~/summary';

export interface ISummary extends TSummary, Document {}

const sumSchema: Schema = new Schema({
  //第幾週 (格式為 yyyymm)
  week: {
    type: String,
    require: true
  },
  //每週的起算日 (禮拜一)
  startingDate: {
    type: Date,
    require: true
  },
  //總共幾件需求
  total: {
    type: Number,
    require: true
  },
  //審核中需求件數
  reviewing: {
    type: Number,
    require: true
  },
  //進行中需求件數
  prcd: {
    type: Number,
    require: true
  },
  //完成需求件數
  done: {
    type: Number,
    require: true
  },
  //取消需求件數
  cancel: {
    type: Number,
    require: true
  },
  //過期需求件數
  delay: {
    type: Number,
    require: true
  },
  //被退件需求件數
  rejected: {
    type: Number,
    require: true
  },
  /** P1~P3 個別工廠所提出的件數統計數據 */
  P1: {
    total: { type: Number, require: true },
    reviewing: { type: Number, require: true },
    prcd: { type: Number, require: true },
    done: { type: Number, require: true },
    cancel: { type: Number, require: true },
    delay: { type: Number, require: true },
    rejected: { type: Number, require: true }
  },
  P2: {
    total: { type: Number, require: true },
    reviewing: { type: Number, require: true },
    prcd: { type: Number, require: true },
    done: { type: Number, require: true },
    cancel: { type: Number, require: true },
    delay: { type: Number, require: true },
    rejected: { type: Number, require: true }
  },
  P3: {
    total: { type: Number, require: true },
    reviewing: { type: Number, require: true },
    prcd: { type: Number, require: true },
    done: { type: Number, require: true },
    cancel: { type: Number, require: true },
    delay: { type: Number, require: true },
    rejected: { type: Number, require: true }
  }
});

sumSchema.set('collection', 'summary');

const sumModel = model<ISummary>('summary', sumSchema);

export default sumModel;
