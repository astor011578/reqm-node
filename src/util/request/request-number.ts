import { StatusCodes } from 'http-status-codes';
import reqModel, { IRequest } from '@/models/user-request';
import { getDateString } from '@/util/request/date-string';
import { CustomError } from '@/errors/index';

export class GenerateReqNoError extends CustomError {
  constructor(message: 'Error occured when generating reqNo', statusCode: StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

/**
 * @description 生成 reqNo, 格式為yymmddnn (nn: 流水號, 當日的第幾件)
 * @returns { String } reqNo
 */
export default async (): Promise<string> => {
  try {
    //1. 生成 default reqNo (format: yymmdd01)
    const today: string = getDateString(false);
    const yy: string = today.substring(2, 4);
    const mm: string = today.substring(5, 7);
    const dd: string = today.substring(8);
    let reqNo: string = [yy, mm, dd].join('') + '01';

    //2. 與 DB 中現有的資料做比對, 因為 reqNo 必須為唯一值
    const data: Array<IRequest> = await reqModel.find({}, null, {
      sort: { reqNo: 1 }
    });

    const reqNos: string[] = [];
    data.forEach((doc: IRequest) => {
      if (doc.reqNo) reqNos.push(doc.reqNo.toString());
    });

    for (const item of reqNos) {
      if (item === reqNo) {
        //取出重複編號的末兩碼 nn 後 +1
        const nn = parseInt(item.slice(6)) + 1;
        //若新的 nn < 10，須補上十位數的 0
        reqNo = nn < 10 ? `${reqNo.slice(0, 6)}0${nn}` : `${reqNo.slice(0, 6)}${nn}`;
      }
    }

    return reqNo;
  } catch (err: GenerateReqNoError | any) {
    throw err;
  }
};
