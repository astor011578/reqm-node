import { NextFunction, Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import ApiError from '@/util/errors/api-error';

export interface HTTPError extends Error {
  status?: number;
}

export function apiErrorValidator(error: HTTPError, _: Partial<Request>, res: Response, next: NextFunction): void {
  const errorCode = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(errorCode).json(ApiError.format({ code: errorCode, message: error.message }));
}
