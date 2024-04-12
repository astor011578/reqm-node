import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import validator from '@/util/validator/index';
import { ValidationError, DataNotFoundError, CustomError } from '@/errors/index';
import userModel, { IUser } from '@/models/user';

/**
 * @description 取得單筆使用者資料
 */
export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    //1. 檢查請求中所夾帶的 userId 格式
    await validator(userId, 'userId');

    //2. 查詢此使用者的資料
    const user: IUser | null = await userModel.findOne({ userId });
    if (!user) throw new DataNotFoundError(`userId ${userId}`);

    //3. 剔除密碼、_id、__v 資訊
    const data: any = {};
    for await (const [key, value] of Object.entries(user['_doc'])) {
      switch (key) {
        case 'hash':
        case '_id':
        case '__v': {
          break;
        }
        default: {
          data[key] = value;
          break;
        }
      }
    }

    //4. 返回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Search user ${userId} data successfully`,
      data
    });
  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 取得多筆 "在職中的" users (若需要查詢特定部門請使用 query, ex: /users?dept=IT)
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const { dept } = req.query;

  try {
    //1. 如果請求內容帶有 dept 資訊，則檢查其格式
    if (dept) await validator(dept, 'dept');

    //2. 設置查詢條件
    const criteria = dept ? { dept, isResigned: false } : { isResigned: false };

    //3. 查詢符合條件的使用者資料
    const users: Array<IUser> = await userModel.find(criteria);

    //4. 剔除密碼、_id、__v 資訊
    const data: Array<any> = [];
    for await (const user of users) {
      const keys = Object.keys(user['_doc']);
      const filteredUser = {};
      for await (const key of keys) {
        switch (key) {
          case 'hash':
          case '_id':
          case '__v': {
            break;
          }
          default: {
            filteredUser[key] = user[key];
            break;
          }
        }
      }
      data.push(filteredUser);
    }

    //5. 返回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Search ${dept ? dept + ' department' : 'all'} users successfully`,
      data
    });
  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 帳號註冊
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { password, dept, email, nameEn, nameZh } = req.body;

  try {
    //1. 檢查前端傳來的值
    await validator(userId, 'userId');
    await validator(password, 'password');
    await validator(email, 'email');
    await validator(dept, 'dept');
    await validator(nameEn, 'nameEn');

    //2. 檢查帳號是否已被註冊過
    const users: Array<IUser> = await userModel.find();
    const userIds = users.map((user) => user.userId); //資料庫中所有 user 的 userId
    if (userIds.includes(userId)) throw new ValidationError(`${userId} has been registered`);

    //3. 將密碼明碼進行雜湊
    const hash = await bcrypt.hash(password, 12);

    //4. 建立新使用者
    const newUser: IUser = new userModel({
      userId, //員工工號
      hash,   //密碼加鹽後的雜湊值
      dept,   //所屬部門
      email,  //綁定信箱
      nameEn, //英文姓名
      roles: ['Add request'] //系統權限
    });
    //中文姓名 (如果有傳入此值就一併存入資料庫)
    if (nameZh && typeof nameZh === 'string' && nameZh.trim() !== '') {
      newUser.nameZh = nameZh;
    }

    //5. 將使用者資訊存入資料庫中
    const userDoc = await newUser.save();

    //6. 返回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Account ${userDoc.userId} registered successfully`
    });

  } catch (err: CustomError | any) {
    const { statusCode, message } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 修改使用者基本資料 (修改信箱、中文姓名、部門)
 */
export const changeInfo = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;
  const { email, nameZh, dept } = req.body;

  try {
    //1. 檢查請求夾帶的資訊是否有誤
    await validator(userId, 'userId');

    //2. 從資料庫中查詢此位使用者資料
    const user: IUser | null = await userModel.findOne({ userId });
    if (!user) throw new DataNotFoundError(`userId ${userId}`);

    //3. 修改使用者資訊
    //3-1. 如果有傳入電子信箱，則檢查輸入值格式是否有誤，並修改資料
    if (email) {
      await validator(email, 'email');
      if (!email.includes('@')) throw new ValidationError('Invalid email format');
      user.email = email;
    }
    //3-2. 如果有傳入中文姓名，則檢查輸入值格式是否有誤，並修改資料
    if (nameZh) {
      await validator(nameZh, 'nameZh');
      user.nameZh = nameZh;
    }
    //3-3. 如果有傳入部門資料，則檢查輸入值格式是否有誤，並修改資料
    if (dept) {
      await validator(dept, 'dept');
      user.dept = dept;
    }

    //4. 將修改內容存入資料庫中
    const userDoc = await user.save();

    //5. 返回 response
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `User ${userDoc.userId} data has been updated successfully`
    });
  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 修改使用者權限
 */
export const changeRoles = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;
  const { roles } = req.body;

  try {
    //1. 檢查請求夾帶的資訊是否有誤
    await validator(userId, 'userId');

    //2. 從資料庫中查詢此位使用者資料
    const user: IUser | null = await userModel.findOne({ userId });
    if (!user) throw new DataNotFoundError(`userId ${userId}`);

    //3. 如果請求中沒有夾帶 roles 資訊，則不變動此使用者的資料
    if (!roles) {
      res.status(StatusCodes.OK).json({
        status: 'success',
        message: `${userId} data remains unchanged`
      });
    } else {
      //4. 請求中有夾帶 roles 資訊，則檢查格式是否正確
      //4-1. 確保 roles 型態為 array
      if (typeof roles !== 'object') throw new ValidationError('Invalid roles format, it should be an array');
      if (!roles.length && roles.length !== 0) throw new ValidationError('Invalid roles format, it should be an array');

      //最後將要被存入資料庫中的 roles
      let finalRoles: string[] = [];
      const defaultRole = 'Add request';

      //4-2. 攔截前端傳來的 roles 為空陣列，將不會更動使用者的權限
      if (roles.length === 0) {
        res.status(StatusCodes.OK).json({
          status: 'success',
          message: `${userId} data remains unchanged`
        });
      } else {
        //4-3. roles 不為空陣列時, 檢查其內容
        //取得事先定義好的所有權限選項
        const options: string[] = await user.getAllRoles();
        //剔除 roles 中的重複值
        const uniqueRoles: string[] = [...new Set<string>(roles)];
        //再篩選出 roles 與 options 共同擁有的值
        const commonRoles = uniqueRoles.filter((value) => options.includes(value));
        //先將篩選出來的元素都加入 finalRoles
        finalRoles = commonRoles.slice();
        //如果篩選出來的內容中沒有包含預設權限，則將其加入 finalRoles
        if (!commonRoles.includes(defaultRole)) finalRoles.push(defaultRole);

        //5. 將變更內容存入資料庫
        user.roles = finalRoles;
        const userDoc = await user.save();

        //6. 返回 response
        res.status(StatusCodes.OK).json({
          status: 'success',
          message: `Changing user ${userDoc.userId} permissions successfully`
        });
      }
    }

  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};

/**
 * @description 修改使用者為離職 / 在職員工
 */
export const resignation = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;
  const { isResigned } = req.body;

  try {
    //1. 檢查請求所夾帶的 userId 格式
    await validator(userId, 'userId');

    //2. 檢查請求所夾帶的 isResigned 是否為 boolean
    if (typeof isResigned !== 'boolean') throw new ValidationError('Invalid isResigned format');

    //3. 查詢此筆使用者的資料
    const user: IUser | null = await userModel.findOne({ userId });
    if (!user) throw new DataNotFoundError(`userId ${userId}`);

    //4. 修改此使用者是否在職欄位
    user.isResigned = isResigned;

    //5. 儲存變更內容至資料庫
    const userData = await user.save();

    //6. 返回 response
    const adjective = isResigned ? 'a resigned' : 'an active';
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Changing user ${userData.userId} to ${adjective} employee`
    });

  } catch (err: CustomError | any) {
    const { message, statusCode } = err;
    res.status(statusCode).json({
      status: 'failed',
      message
    });
  }
};
