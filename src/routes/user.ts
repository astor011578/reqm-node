import { Controller, Get, Post, Patch } from '@overnightjs/core';
import { Request, Response } from 'express';
import {
  getUser,
  register,
  changeInfo,
  changeRoles,
  resignation
} from '@/controllers/user';

@Controller('user')
export class UserRouter {
  /**
   * @description 取得一筆使用者資料
   */
  @Get(':userId')
  public async getUser(req: Request, res: Response): Promise<any> {
    await getUser(req, res);
  }

  /**
   * @description 使用者註冊
   */
  @Post('register/:userId')
  public async register(req: Request, res: Response): Promise<any> {
    await register(req, res);
  }

  /**
   * @description 修改使用者資料 (電子信箱, 中文姓名, 所屬部門)
   */
  @Patch('basic-info/:userId')
  public async changeInfo(req: Request, res: Response): Promise<any> {
    await changeInfo(req, res);
  }

  /**
   * @description 修改使用者權限
   */
  @Patch('roles/:userId')
  public async changeRoles(req: Request, res: Response): Promise<any> {
    await changeRoles(req, res);
  }

  /**
   * @description 修改使用者在職狀態 (在職中 / 已離職)
   */
  @Patch('resignation/:userId')
  public async resignation(req: Request, res: Response): Promise<any> {
    await resignation(req, res);
  }
}
