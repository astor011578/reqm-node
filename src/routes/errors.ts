import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import { CustomError } from '@/errors/index';
import logModel from '@/models/logs';

@Controller('errors')
export class ErrorRouter {
  /**
   * @description 新增錯誤訊息
   */
  @Post('insert')
  public async recordErrors(req: Request, res: Response): Promise<any> {
    try {
      //1, 取得要存入資料庫中的訊息
      const logData = req.body;

      //2. 建立一筆新的 log
      const newLog = new logModel({
        type: 'error',
        error: logData,
        timestamp: new Date()
      });

      //3. 將新 log 資料存入資料庫中
      const requestDoc = await newLog.save();

      //4. 傳回 response
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: `Record new error logs successfully`,
        data: requestDoc
      });

    } catch (err: CustomError | any) {
      const { statusCode, message } = err;
      res.status(statusCode).json({
        status: 'failed',
        message
      });
    }

  }
}
