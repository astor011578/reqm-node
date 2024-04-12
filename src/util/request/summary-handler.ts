import { Types } from 'mongoose';
import { TSummary } from '~/summary';
import reqModel from '@/models/request';
import sumModel, { ISummary } from '@/models/summary';
import { getWeekString } from '@/util/request/week-string';

interface ISummaryDocument extends ISummary {
  _id: Types.ObjectId;
}

/**
 * @description 取得需求週報的預設值
 */
export async function getDefaultSummay(): Promise<TSummary | void> {
  try {
    //1. 取得當週的 week string
    const week = await getWeekString(new Date());

    //2. 取得資料庫中當週的需求
    const requests = await reqModel.find({ thisWeek: true });

    //3. 處理一筆新的 weekly summary 預設內容
    const newSummary: TSummary = {
      week,
      startingDate: new Date(),
      total: 0,
      reviewing: 0,
      prcd: 0,
      done: 0,
      cancel: 0,
      delay: 0,
      rejected: 0,
      P1: {
        total: 0,
        reviewing: 0,
        prcd: 0,
        done: 0,
        cancel: 0,
        delay: 0,
        rejected: 0
      },
      P2: {
        total: 0,
        reviewing: 0,
        prcd: 0,
        done: 0,
        cancel: 0,
        delay: 0,
        rejected: 0
      },
      P3: {
        total: 0,
        reviewing: 0,
        prcd: 0,
        done: 0,
        cancel: 0,
        delay: 0,
        rejected: 0
      }
    };
    //3-1. key 表示 TRequest 中的 status, key 所對應的 value 則為 TSummary 中的欄位名稱
    const mappingKeys = {
      Reviewing: 'reviewing',
      Returned: 'reviewing',
      Rejected: 'rejected',
      Proceeding: 'prcd',
      Done: 'done',
      Cancel: 'cancel'
    };
    //3-2. 依每筆需求的 status 做數量更新
    for await (const request of requests) {
      const status = request.status;
      const plant = request.reqTable.plant;
      newSummary[mappingKeys[status]]++;
      newSummary[plant][mappingKeys[status]]++;
      newSummary.total++;
      newSummary[plant].total++;
    }

    //4. 返回 weekly summary 預設內容
    return newSummary;

  } catch (err) {
    console.error(err);
  }
};

/**
 * @description 更新現有的 weekly summary document
 * @param { string } status (required): 哪個狀態要 +1
 * @param { string } plant (required): 哪個廠區要 +1
 */
export default async (status: string, plant: string) => {
  /**
   * @description 複用程式碼用, 如果查不到此週的 doc, 會創建一筆新的 newDoc, 此函式是用來更新 doc 或 newDoc 各個欄位數量用
   * @param { ISummaryDocument } $doc newDoc 或 doc
   * @param { string } $status 等同於 updateSummary() 的參數 status
   * @param { string } $plant 等同於 updateSummary() 的參數 plant
   * @returns { ISummaryDocument } 回傳 $doc
   */
  const updateQty = async ($doc: ISummaryDocument, $status: string, $plant: string): Promise<ISummaryDocument> => {
    $doc[$status]++;
    $doc[$plant][$status]++;

    switch ($status) {
      //有需求結案 ('done' | 'cancel') 時會進此 case
      case 'done':
      case 'cancel': {
        $doc.prcd--;
        $doc[$plant].prcd--;
        break;
      }
      //有新的需求時會進此 case
      case 'reviewing': {
        $doc.total++;
        $doc[$plant].total++;
        break;
      }
      case 'prcd':
      case 'rejected': {
        $doc.reviewing--;
        $doc[$plant].reviewing--;
        break;
      }
    }
    return $doc;
  };

  try {
    //1. 查詢當週資料
    const week = await getWeekString(new Date());
    let doc = await sumModel.findOne({ week });

    //2. 處理要更新的內容
    let updated: ISummaryDocument;
    if (!doc) {
      //2-1. 如果資料庫中查無當週資料, 則創建一筆新的資料
      console.log(`[Info] 查無第 ${week} 週的 weekly summary, 創建一筆新資料`);
      let newDoc = new sumModel(await getDefaultSummay());
      newDoc = await updateQty(newDoc, status, plant);
      updated = await newDoc.save();
    } else {
      //2-2. 如果資料庫中有當週資料, 則直接更新其內容
      console.log(`[Info] 更新第 ${week} 週的 weekly summary`);
      doc = await updateQty(doc, status, plant);
      updated = await doc.save();
    }

  } catch (err) {
    console.error(err);
  }
};
