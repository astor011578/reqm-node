import { Controller, Middleware, Post } from '@overnightjs/core';
import { Request, Response, NextFunction } from 'express';
import { login, logout } from '@/controllers/auth';
import sign from '@/middlewares/sign-JWT';
import verify from '@/middlewares/verify-JWT';

@Controller('')
export class AuthRouter {
  /**
   * @description 使用者登入
   */
  @Post('login')
  @Middleware([login, sign])
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    await login(req, res, next);
  }

  /**
   * @description 使用者登出
   */
  @Post('logout')
  public logout(req: Request, res: Response): void {
    logout(req, res);
  }

  /**
   * @description JWT 驗證
   */
  @Post('auth')
  public async auth(req: Request, res: Response): Promise<void> {
    await verify(req, res);
  }
}
