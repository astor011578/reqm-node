import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { getByStatus, getPendings } from '@/controllers/user-request';

@Controller('requests')
export class UserRequestsRouter {
  /**
   * @description 取得多筆需求資料 (如果需要依照狀態查詢, 請加上 query, e.g. /requests?status=Proceeding)
   */
  @Get()
  public async getByStatus(req: Request, res: Response): Promise<any> {
    await getByStatus(req, res);
  }

  /**
   * @description 取得等待簽閱的需求 (需求申請審核, 取消需求申請的審核...等) (如果需要依照狀態查詢, 請加上 query, e.g. /requests/:reviewerId?status=Reviewing)
   */
  @Get('pendings/:reviewerId')
  public async getPendings(req: Request, res: Response): Promise<any> {
    await getPendings(req, res);
  }
}
