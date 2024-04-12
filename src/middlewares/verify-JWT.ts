import jwt from 'jsonwebtoken';
import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import { getEnv } from '@/util/env-variables';
import { CustomError } from '@/errors/index';
import validator from '@/util/validator/index';
const cert: string = getEnv('PUBLIC_KEY');

/**
 * @description 自定義錯誤類別: 處理沒有 token 的情況
 */
class MissingJWTError extends CustomError {
  constructor(message = 'JWT cannot be found, please login', statusCode = StatusCodes.UNAUTHORIZED) {
    super(message, statusCode);
  }
}

/**
 * @description 自定義錯誤類別: 處理 Authorization 內容格式錯誤的情況
 */
class InvalidAuthError extends CustomError {
  constructor(message = 'Invalid Authorization header', statusCode = StatusCodes.UNAUTHORIZED) {
    super(message, statusCode);
  }
}

/**
 * @description 驗證 JWT 簽章
 */
export default async (req: Request, res: Response): Promise<void> => {
  try {
    const authorization: string = req.headers.authorization!;

    //1. 如果沒有 Authorization
    await validator(authorization, 'Authorization', new MissingJWTError());

    //2. 檢查 JWT 簽章格式
    const tokenType = authorization.split(' ')[0];
    if (tokenType !== 'Bearer') throw new InvalidAuthError();

    //3. 檢查 JWT 內容是否為空字串
    const token = authorization.split(' ')[1];
    await validator(token, 'JWT');

    //4. 驗證 JWT 簽章內容
    jwt.verify(token, cert, (err, decoded) => {
      if (err) throw err;

      const iat = decoded!['iat'];
      const exp = decoded!['exp'];
      const payload = decoded!['payload'];
      const { iss, sub, roles } = payload;
      const userInfo = {
        iss,
        exp,
        iat,
        roles,
        userId: sub
      };

      //5. 返回 response
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: `Account ${sub}'s token was verified successfully`,
        data: userInfo
      });
    });
  } catch (err: CustomError | any) {
    let message: string;
    const statusCode = StatusCodes.UNAUTHORIZED;

    //1. 如果是 JWT 過期
    if (err?.name === 'TokenExpiredError') message = `JWT expired, please login again`;

    //2. 如果不是因為 JWT 過期而報錯
    message = err?.message;

    //3. 返回 response
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};
