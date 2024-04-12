import { Controller, Get, Post, Patch } from '@overnightjs/core';
import { Request, Response } from 'express';
import { newReq, revReq, editReq, getByReqNo } from '@/controllers/request';
import {
  rescheduleReq, updateEvidence, reviewEvidence,
  applyCancellation, reviewCancellation
} from '@/controllers/update-request';

@Controller('request')
export class RequestRouter {
  /**
   * @description 取得一筆需求資料
   */
  @Get(':reqNo')
  public async getByReqNo(req: Request, res: Response): Promise<any> {
    await getByReqNo(req, res);
  }

  /**
   * @description 新增一筆需求
   */
  @Post('new')
  public async newReq(req: Request, res: Response): Promise<any> {
    await newReq(req, res);
  }

  /**
   * @description 審核需求
   */
  @Patch('review/:reqNo')
  public async revReq(req: Request, res: Response): Promise<any> {
    await revReq(req, res);
  }

  /**
   * @description 修改需求
   */
  @Patch('edit/:reqNo')
  public async editReq(req: Request, res: Response): Promise<any> {
    await editReq(req, res);
  }


  //以下與更新一條需求有關

  /**
   * @description 更新與上傳證明功能有關的欄位
   */
  @Patch('reschedule/:reqNo')
  public async rescheduleReq(req: Request, res: Response): Promise<any> {
    await rescheduleReq(req, res);
  }

  /**
   * @description 更新與上傳證明功能有關的欄位
   */
  @Patch('evidence/:reqNo')
  public async updateEvidence(req: Request, res: Response): Promise<any> {
    await updateEvidence(req, res);
  }

  /**
   * @description 簽閱上傳證明
   */
  @Patch('approve/:reqNo')
  public async reviewEvidence(req: Request, res: Response): Promise<any> {
    await reviewEvidence(req, res);
  }

  /**
   * @description 遞交需求取消申請
   */
  @Patch('apply-cancellation/:reqNo')
  public async applyCancellation(req: Request, res: Response): Promise<any> {
    await applyCancellation(req, res);
  }

  /**
   * @description 審核需求取消申請
   */
  @Patch('review-cancellation/:reqNo')
  public async reviewCancellation(req: Request, res: Response): Promise<any> {
    await reviewCancellation(req, res);
  }
}
