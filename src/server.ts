import 'module-alias/register';
import { Server } from '@overnightjs/core';
import express, { Application } from 'express';
import { config as envConfig } from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import * as path from 'path';
import * as http from 'http';
const envPath = path.resolve(__dirname, '..', 'config.env');
envConfig({ path: envPath });

import { getEnv } from './util/env-variables';
import * as database from '@/config/database';
import { AuthRouter } from '@/routes/auth';
import { UserRouter } from '@/routes/user';
import { UsersRouter } from '@/routes/users';
import { UserRequestRouter } from '@/routes/user-request';
import { UserRequestsRouter } from '@/routes/user-requests';
import { UploadRouter } from '@/routes/upload';
import { SummaryRouter } from '@/routes/summary';
import { ErrorRouter } from '@/routes/errors';
import { apiErrorValidator } from './middlewares/api-error-validator';
import doScheduleJobs from '@/schedule/cron';

const ENV: string = getEnv('NODE_ENV');
const PORT: number = getEnv('PORT') ? Number.parseInt(getEnv('PORT')) : 6000;
const ROOT_PATH: string = path.resolve(__dirname, '..');
const UPLOAD_PATH: string = ENV === 'prod' ? path.join(ROOT_PATH, '/public') : getEnv('UPLOAD_PATH_DEV');

export class SetupServer extends Server {
  private server?: http.Server;
  constructor(private port = PORT) {
    super();
  }

  public async init(): Promise<void> {
    this.setupExpress();
    await this.databaseSetup();
    this.controllersSetup();
    await this.setupScheduleJobs();
    this.setupErrorHandlers(); //must be the last
  }

  private setupExpress(): void {
    this.app.use(bodyParser.json());
    this.app.use(
      bodyParser.urlencoded({
        extended: true
      })
    );
    this.app.use(
      cors({
        origin: '*'
      })
    );
    this.app.use(morgan('dev')); //log HTTP requests
    this.app.use('/uploads', express.static(UPLOAD_PATH)); //檔案上傳路徑
  }

  private async setupScheduleJobs(): Promise<void> {
    await doScheduleJobs();
  }

  private setupErrorHandlers(): void {
    this.app.use(apiErrorValidator);
  }

  public getApp(): Application {
    return this.app;
  }

  private controllersSetup(): void {
    const authRouter = new AuthRouter();
    const userRouter = new UserRouter();
    const usersRouter = new UsersRouter();
    const requestRouter = new UserRequestRouter();
    const requestsRouter = new UserRequestsRouter();
    const uploadRouter = new UploadRouter();
    const summaryRouter = new SummaryRouter();
    const errorLogRouter = new ErrorRouter();
    super.addControllers([
      authRouter,
      userRouter,
      usersRouter,
      requestRouter,
      requestsRouter,
      uploadRouter,
      summaryRouter,
      errorLogRouter,
    ]);
  }

  private async databaseSetup(): Promise<void> {
    await database.connect();
  }

  public async close(): Promise<void> {
    await database.close();
    if (this.server) {
      await new Promise((resolve, reject) => {
        this.server?.close((error) => {
          if (error) return reject(error);
          resolve(true);
        });
      });
    }
  }

  public start(): void {
    const SERVER_INFO = `[Info] Switch to ${ENV} mode, server is listening on ${this.port}`;
    this.server = this.app.listen(this.port, () => console.log(SERVER_INFO));
  }
}
