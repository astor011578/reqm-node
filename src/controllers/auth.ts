import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import StatusCodes from 'http-status-codes';
import userModel, { IUser } from '@/models/user';
import validator from '@/util/validator/index';
import { CustomError } from '@/errors/index';

/**
 * @description 自訂錯誤類別: 處理登入帳號密碼錯誤情形
 */
class IncorrectUserInfoError extends CustomError {
  constructor(message: string, statusCode = StatusCodes.UNAUTHORIZED) {
    super(message, statusCode);
  }
}

/**
 * @description 登入
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId, password } = req.body;

  try {
    //1. 檢查前端傳來的輸入值是否有誤
    await validator(userId, 'userId');
    await validator(password, 'password');

    //2. 檢查是否有此帳號資料
    const user: IUser | null = await userModel.findOne({ userId });
    if (!user) throw new IncorrectUserInfoError(`Incorrect userId. Or ${userId} data cannot be found`);

    //3. 檢查是否為仍在職員工
    if (user.isResigned) throw new IncorrectUserInfoError(`Account ${userId} has been deactivated. Please contact the administrator`);

    //4. 檢查密碼是否正確
    const { hash } = user;
    const isValid = await bcrypt.compare(password, hash);

    //5. 密碼不正確則進入 catch 區塊
    if (!isValid) throw new IncorrectUserInfoError('Incorrect password');

    //6. 密碼正確則進入下一個中間件
    return next();
  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 登出
 */
export const logout = (req: Request, res: Response): void => {
  res.status(StatusCodes.OK).json({
    status: `success`,
    message: 'Logout successfully'
  });
};
