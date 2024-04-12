import nodemailer from 'nodemailer';
import StatusCodes from 'http-status-codes';
import userModel from '@/models/user';
import htmlGenerator, { TMailInfo } from './html-generator';
import mapping from './mapping';  //存放不同的信件類型 (type) 所對應的 subject, subtitle
import { CustomError } from '@/errors/index';
import { getEnv } from '@/util/env-variables';
import getAdminIds from '@/util/request/get-admin-ids';
const NODE_ENV = getEnv('NODE_ENV');
const MAIL_HOST = getEnv('SMTP_HOST');
const MAIL_PORT = Number.parseInt(getEnv('SMTP_PORT'), 10);
const MAIL_USER = getEnv('SMTP_USER');
const MAIL_PASSWORD = getEnv('SMTP_PASSWORD');

//是否開啟寄信功能 (請手動到 config.env 去更改, 或到 package.json 再設置一個 scripts)
const isAutoMailing = getEnv('SEND_MAIL') === 'true' ? true : false;
console.log('[Info] 寄信功能是否啟用?', isAutoMailing);

//關於寄信功能的自定義錯誤類別
class MailError extends CustomError {
  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

export default class Mail {
  $type: string;
  $from: string;
  $subject?: string;
  $to?: string[];
  $html?: string;
  /**
   * @constructor 創建 mail 實例
   * @param { string } $type: 此封信件的類型
   */
  constructor($type: string) {
    this.$type = $type;
    this.$from = 'no-reply@reqm.com';
    this.$subject = this.getSubject(this.$type);
    this.$to;
    this.$html;
  }

  /**
   * @description 取得收件人的 mail addresses
   * @param { string[] } receiverIds: 收件人工號
   * @returns { string[] } mails: 收件人信箱
   */
  async getEMails(receiverIds: string[]): Promise<string[] | any> {
    const mails: string[] = [];
    let userIds: string[] = [];

    try {
      switch (NODE_ENV) {
        //正式環境下寄信給正確的收件人
        case 'prod': {
          if (Array.isArray(receiverIds) && receiverIds.length) {
            userIds = Object.assign([], receiverIds);
          } else {
            throw new MailError('Parameter `receiverIds` should be a string[]');
          }
          break;
        }
        //非正式環境下寄信給 admin (假如資料庫沒有設定 admin, 則不寄出任何信件)
        default: {
          const adminIds = await getAdminIds();
          userIds = Object.assign([], adminIds);
          break;
        }
      }

      for await (const userId of userIds) {
        const user = await userModel.findOne({ userId });
        if (!user || !user.email) throw new MailError(`user ${userId} data cannot be found`);
        mails.push(user.email);
      }

      this.$to = mails;

    } catch (err: CustomError | any) {
      console.error(err);
    }
  }

  /**
   * @description 取得此信件實例的主旨
   * @param { string } type: 此封信件的類型
   * @returns { string } 
   */
  getSubject(type: string): string | undefined {
    try {
      if (mapping[type] === undefined) throw new MailError(`Cannot find the mail type \`${type}\``);
      const subject = mapping[type].subject;
      return subject;

    } catch (err: CustomError | any) {
      console.error(err);
      return undefined;
    }
  }

  /**
   * @description 取得此信件實例的內文 html 字串
   * @param { TMailInfo[] } info: 要塞進信件內文中的表格的內容, 格式請見 TMailInfo
   */
  async getHtml(info: TMailInfo[]): Promise<void> {
    try {
      if (mapping[this.$type] === undefined) throw new MailError(`Cannot find the mail type \`${this.$type}\``);
      //取得 subtitle
      const subtitle = mapping[this.$type].subtitle;
      const htmlStr = await htmlGenerator(subtitle, info);
      this.$html = htmlStr;

    } catch (err: CustomError | any) {
      console.error(err);
    }
  }

  /**
   * @description 寄出系統信
   */
  async sendMail(): Promise<void> {
    try {
      if (isAutoMailing) {
        const transporter = nodemailer.createTransport({
          host: MAIL_HOST,
          port: MAIL_PORT,
          auth: {
            user: MAIL_USER,
            pass: MAIL_PASSWORD
          }
        });

        const errorMessage = (propName: string): string => {
          return `A property for '${propName}' was not provided`;
        };

        if (!this.$from) {
          throw new MailError(errorMessage('$from'));
        } else if (!this.$subject) {
          throw new MailError(errorMessage('$subject'));
        } else if (!this.$to) {
          throw new MailError(errorMessage('$to'));
        } else if (!this.$html) {
          throw new MailError(errorMessage('$html'));
        } else {
          const options = {
            from: this.$from,
            to: this.$to.toString(),
            subject: this.$subject,
            html: this.$html,
          };

          //for debugging
          // console.log(options);

          await transporter.sendMail(options);
          console.log(`成功寄出系統信 (信件類型: ${this.$type})`);
        }
      } else {
        console.log(`[Info] 寄信功能關閉, 無信件被寄出`);
      }

    } catch (err: CustomError | any) {
      console.error(err);
    }
  }
}
