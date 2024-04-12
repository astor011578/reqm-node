import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import { DataNotFoundError, CustomError } from '@/errors/index';
import { TSummary } from '~/summary';
import sumModel from '@/models/summary';

/**
 * @description 獲取需求的週報資料
 */
export const getReqSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. 查詢所有 weekly summary data
    const data = await sumModel.find({}).sort({ week: 1 });
    if (!data || !data.length) throw new DataNotFoundError(`Request weekly summary`);

    //2. 找到 data, 處理內容格式
    const responseData: TSummary[] = data.map(data => {
      const {
        P1, P2, P3, week, startingDate, total,
        reviewing, prcd, done, cancel, delay, rejected
      } = data;
      return {
        P1, P2, P3, week, startingDate, total,
        reviewing, prcd, done, cancel, delay, rejected
      };
    });

    //3. 傳送回應給 client
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Get summary data successfully',
      data: responseData
    });

  } catch (err: CustomError | any) {
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};
