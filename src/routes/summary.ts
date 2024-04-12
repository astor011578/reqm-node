import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { getReqSummary } from '@/controllers/summary';

@Controller('summary')
export class SummaryRouter {
  /**
   * @description 取得需求週報資料
   */
  @Get('requests/:timestamp')
  public async getReqSummary(req: Request, res: Response): Promise<any> {
    await getReqSummary(req, res);
  }
}
