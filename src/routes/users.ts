import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { getUsers } from '@/controllers/user';

@Controller('users')
export class UsersRouter {
  /**
   * @description 取得多名 "在職中" 使用者資料
   */
  @Get()
  public async getUsers(req: Request, res: Response): Promise<any> {
    await getUsers(req, res);
  }
}
