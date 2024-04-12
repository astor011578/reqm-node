/**
 * @description 產生當前日期字串 ('yyyy/mm/dd' || 'yyyy/mm/dd hh:mm:ss')
 * @param { Boolean } isDatetime 是否要生成時間戳 datetime
 * @returns { String } 'yyyy/mm/dd' || 'yyyy/mm/dd hh:mm:ss'
 */
export function getDateString(isDatetime: boolean): string {
  const currentTime: Date = new Date();
  const yyyy: string = currentTime.getFullYear().toString();
  let mm: number | string = currentTime.getMonth() + 1;
  let dd: number | string = currentTime.getDate();
  mm = mm < 10 ? '0' + mm : mm.toString();
  dd = dd < 10 ? '0' + dd : dd.toString();

  if (isDatetime === true) {
    let HH: number | string = currentTime.getHours();
    let MM: number | string = currentTime.getMinutes();
    let ss: number | string = currentTime.getSeconds();
    HH = HH < 10 ? '0' + HH : HH.toString();
    MM = MM < 10 ? '0' + MM : MM.toString();
    ss = ss < 10 ? '0' + ss : ss.toString();
    return `${yyyy}/${mm}/${dd} ${HH}:${MM}:${ss}`;
  }
  return `${yyyy}/${mm}/${dd}`;
}

/**
 * @description 修改日期格式, 轉為 'yyyy/mm/dd', 或 'mm/dd' 的字串
 * @param { Date | Date[] | undefined } date 需要被轉換的日期值
 * @param { 'full' | 'no-year' } format 轉換出的日期字串格式為何
 * @returns { string }
 */
export function dateFormatter(date: Date | Date[] | undefined, format: 'full' | 'no-year'): string {
  let before: any;
  let after: string;

  //輸入的值是否為陣列, 如果是, 則只取最後一個元素
  if (Array.isArray(date)) {
    before = !date.length ? null : date.slice(-1)[0];
  } else {
    before = !date ? null : date;
  }

  if (!before) {
    return '';
  } else {
    let mm: any = before.getMonth() + 1;
    let dd: any = before.getDate();

    switch (format) {
      //將原值轉為 yyyy/mm/dd 的格式
      case 'full': {
        const yyyy: string = before.getFullYear().toString();
        mm = mm < 10 ? `0${mm}` : mm.toString();
        dd = dd < 10 ? `0${dd}` : dd.toString();
        after = [yyyy, mm, dd].join('/');
        break;
      }
      //將原值轉為 mm/dd 的格式
      case 'no-year': {
        after = [mm, dd].join('/');
        break;
      }
    }
    return after;
  }
}
