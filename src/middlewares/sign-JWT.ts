import jwt from 'jsonwebtoken';
import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import { getEnv } from '@/util/env-variables';
import userModel, { IUser } from '@/models/user';
const secret: string = getEnv('PRIVATE_KEY');

/**
 * @description 發行 JWT 簽章
 */
export default async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;

  try {
    //1. 查詢此使用者的權限
    const user: IUser | null = await userModel.findOne({ userId });
    const roles = user?.roles;

    //2. 發行 JWT 簽章
    const timeLimit = 60 * 60 * 6; //六小時後失效
    const exp = Math.floor(Date.now() / 1000) + timeLimit; //單位為秒
    const payload = {
      iss: 'reqm',
      sub: userId,
      roles
    };
    const token = await jwt.sign({ payload, exp }, secret, {
      algorithm: 'RS256'
    });

    //3. 返回 response
    res.set('Authorization', `Bearer ${token}`);
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Account ${userId} was logged in successfully`,
      authorization: `Bearer ${token}`
    });
  } catch (err) {
    const message = `Failed to issue ${userId}'s JWT`;
    const statusCode = 500;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};
