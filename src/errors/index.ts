import StatusCodes from 'http-status-codes';

export class CustomError extends Error {
  statusCode = StatusCodes.BAD_REQUEST;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  getMessage(): string {
    return this.message;
  }

  getStatusCode(): number {
    return this.statusCode;
  }
}

/**
 * @description 處理前端傳來的值為`null`或`undefined`的情況
 */
export class NullOrUndefinedError extends CustomError {
  constructor(valueName: string, message = `${valueName} cannot be null or undefined`, statusCode = StatusCodes.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * @description 處理前端傳來的值驗證失敗的情況
 */
export class ValidationError extends CustomError {
  constructor(message: string, statusCode = StatusCodes.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * @description 處理前端傳來的字串值為空字串('')的情況
 */
export class EmptyStringError extends CustomError {
  constructor(valueName: string, message = `${valueName} cannot be an empty string`, statusCode = StatusCodes.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * @description 處理前端傳來的物件值為空物件({})的情況
 */
export class EmptyObjectError extends CustomError {
  constructor(valueName: string, message = `${valueName} cannot be an empty object`, statusCode = StatusCodes.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * @description 處理前端傳來的物件值為空陣列([])的情況
 */
export class EmptyArrayError extends CustomError {
  constructor(valueName: string, message = `${valueName} cannot be an empty array`, statusCode = StatusCodes.BAD_REQUEST) {
    super(message, statusCode);
  }
}

/**
 * @description 處理查無資料的情況
 */
export class DataNotFoundError extends CustomError {
  constructor(value: string, message = `${value} data cannot be found`, statusCode = StatusCodes.NOT_FOUND) {
    super(message, statusCode);
  }
}
