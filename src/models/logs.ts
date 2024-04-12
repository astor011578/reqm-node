import { Document, model, Schema } from 'mongoose';
import { TServerLog } from '~/server-log';

export interface IServerLog extends TServerLog, Document { }

/**
 * @description 此 logs collection 是用來存服務端所遭遇的錯誤訊息
 */
const logSchema: Schema = new Schema({
  type: {
    type: String,
    require: true
  },
  fileName: {
    type: String
  },
  info: {
    type: Object
  },
  error: {
    type: Object
  },
  timestamp: {
    type: Date,
    require: true
  }
});

logSchema.set('collection', 'logs');

export default model<IServerLog>('logs', logSchema);
