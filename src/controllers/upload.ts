import path from 'path';
import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import multer, { MulterError } from 'multer';
import fs from 'fs';
import { getEnv } from '@/util/env-variables';
import { CustomError } from '@/errors/index';

const ENV = getEnv('NODE_ENV');
const ROOT_PATH: string = path.resolve(__dirname, '..');
const UPLOAD_PATH = ENV === 'prod' ? path.join(ROOT_PATH, '/public') : getEnv('UPLOAD_PATH_DEV');
let destination: string;

/**
 * @description store upload setting in multer instance
 */
const _multer = multer({
  storage: multer.diskStorage({
    //設定檔案上傳的目錄
    destination: (req, file, cb) => {
      const path = `${UPLOAD_PATH}/${destination}/`;
      fs.mkdirSync(path, { recursive: true });
      cb(null, path);
    },
    //設定儲存檔案時的命名規則, 用目前日期作為檔名
    filename: (req, file, cb) => {
      const fileName = Date.now();
      const extension = file.originalname.split('.').pop();
      cb(null, `${fileName}.${extension}`);
    }
  })
}).array('files');

/**
 * @description upload attached files or evidence files
 */
export default async (req: Request, res: Response): Promise<any> => {
  const { uploadType } = req.params;
  //1. 決定上傳路徑為何
  switch (uploadType) {
    case 'attached-files': {
      destination = 'attached_files';
      break;
    }
    case 'evidence': {
      destination = `${req.query.reqNo}/${req.query.step}`;
      break;
    }
  }

  //2. 使用 multer instance 上傳檔案
  try {
    _multer(req, res, async (err: any) => {
      //3. 如果發生錯誤, 拋出 err 物件到 catch 區塊
      if (err) {
        throw err;
      } else {
        switch (req.files?.length) {
          //4. 如果沒有傳任何檔案給 server
          case 0: {
            res.status(StatusCodes.OK).json({
              status: 'success',
              message: 'There\'s no uploading file',
              data: []
            });
            break;
          }
          //5. 上傳成功
          default: {
            const files = Object.assign([], req.files);
            const data = files.map(file => {
              const { filename, originalname } = file;
              return {
                fileName: filename,
                originalName: originalname
              };
            });
            res.status(StatusCodes.OK).json({
              code: 'success',
              message: 'Upload files successfully',
              data
            });
            break;
          }
        }
      }
    });

  } catch (err: MulterError | CustomError | any) {
    if (err instanceof MulterError) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'A multer error occurred when client was uploading'
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Internal server error'
      });
    }
  }
};
