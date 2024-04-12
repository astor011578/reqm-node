import { getEnv } from '@/util/env-variables';
const NODE_ENV = getEnv('NODE_ENV');
const DOMAIN_NAME = NODE_ENV === 'dev' ? getEnv('DOMAIN_NAME_DEV') : getEnv('DOMAIN_NAME_PROD');
const PORT = getEnv('FRONT_PORT');
const FRONT_NAME = NODE_ENV === 'dev' ? getEnv('FRONT_NAME_DEV') : getEnv('FRONT_NAME_PROD');
const FRONT_URL = NODE_ENV === 'dev' ? `https://${DOMAIN_NAME}:${PORT}${FRONT_NAME}` : `https://${DOMAIN_NAME}/${FRONT_NAME}`;

export type TMailInfo = {
  title: string,
  value: any,
  isLink?: boolean;
};

/**
 * @description 產生 html 模板
 * @param { string } subtitle: 內文中的副標題
 * @param { TMailInfo[] } info: 如果 info.length 不為 0, 會依照給予的值渲染出表格, 格式請見:
 * info = [
 *   {
 *      title: <title>,       //此欄位的名稱
 *      value: <value>,       //此欄位要帶入的值
 *      isLink: true | false  //如果是 true, 屆時會渲染為 <a></a>, 反之則為普通的 text
 *   }
 * ]
 * @returns { string } html 模板字串
 */
export default async (subtitle: string, info: TMailInfo[]): Promise<string> => {
  let html = `
    <div style="font-size: 10pt; font-family: 'Arial, sans-serif';">
      <p>${subtitle}</p>
    </div>
  `;

  if (info.length) {
    html = html.concat(`<table style="border-collapse: collapse; border: 1pt solid #303133; font-size: 10pt; color: #303133; font-family: 'Arial, sans-serif';">`);
    for await (const item of info) {
      if (item.isLink) {
        html = html.concat(
          `<tr>
            <td style="padding: 3pt; width: 100pt; border: 1pt solid gray; background-color: navy; color: #ffffff;"><b>${item.title}</b></td>
            <td style="padding: 3pt; width: 300pt; border: 1pt solid gray;"><a href="${FRONT_URL}#/detail/${item.value}" target="_blank">${item.value}</a></td>
          </tr>`
        );
      } else {
        html = html.concat(
          `<tr>
            <td style="padding: 3pt; width: 100pt; border: 1pt solid gray; background-color: navy; color: #ffffff;"><b>${item.title}</b></td>
            <td style="padding: 3pt; width: 300pt; border: 1pt solid gray;">${item.value}</td>
          </tr>`
        );
      }
    }
    html = html.concat(`</table><br>`);
  }

  html = html.concat(`
  <div style="font-size: 10pt; font-family: 'Arial, sans-serif';">
    <p>此信件由系統自動寄發，請勿直接回信。<br>The mail is sent by system automatically, please do not reply.</p>
    <p><a href="${FRONT_URL}">ReqM</a><br></p>
  </div>`);

  return html;
};
