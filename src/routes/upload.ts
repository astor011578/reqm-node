import { Controller, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import upload from '@/controllers/upload';

@Controller('upload')
export class UploadRouter {
  /**
   * @description 上傳檔案, 必須加上 uploadType param, 可以輸入的值為 'attached-files' | 'evidence'
   * @description 若 uploadType 為 'evidence', 必須再以 query 方式輸入 reqNo 與 step, e.g. /upload/evidence?reqNo=24010101&step=UAT1
   */
  @Post(':uploadType')
  public async upload(req: Request, res: Response): Promise<any> {
    await upload(req, res);
  }
}
