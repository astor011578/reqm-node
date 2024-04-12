import { CustomError, NullOrUndefinedError, EmptyStringError, EmptyObjectError, EmptyArrayError } from '@/errors/index';

/**
 * @description 驗證前端傳來的值是否有誤
 */
export default async function (value: any, valueName: string, customError?: CustomError): Promise<void> {
  //若沒有傳入值則拋出錯誤
  if (!value && value !== 0) throw new NullOrUndefinedError(valueName);

  switch (typeof value) {
    //如果是string, 則檢驗是否為空字串
    case 'string': {
      if (value.trim() === '') {
        throw customError ? customError : new EmptyStringError(valueName);
      }
      break;
    }
    //如果是object, 則先檢查為陣列還是物件
    case 'object': {
      if (Array.isArray(value) === false) {
        //如果是物件, 則檢查是否為空物件 ({})
        const keys: string[] = Object.keys(value);
        if (keys.length === 0 && JSON.stringify(value) === '{}') {
          throw customError ? customError : new EmptyObjectError(valueName);
        }
      } else {
        //如果是陣列, 則檢查是否為空陣列 ([])
        if (value.length === 0) {
          throw customError ? customError : new EmptyArrayError(valueName);
        }
      }
      break;
    }
    default: {
      break;
    }
  }
}
