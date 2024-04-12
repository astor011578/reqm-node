/**
 * @description 輸入一日期以獲取這個日期屬於第幾週的字串 (格式: yyyyww)
 */
export const getWeekString = async (date: Date): Promise<string> => {
  const datetime = date.getTime();
  const year = date.getFullYear();
  const day = date.getDay();
  //獲取每個年份第一週的起算日
  const firstDate = getFirstDateOfYear(year);
  let startDate: number;
  switch (day) {
    case 0: {
      startDate = datetime - 6 * 1000 * 3600 * 24; //ms
      break;
    }
    case 1: {
      startDate = datetime; //ms
      break;
    }
    default: {
      startDate = datetime - (day - 1) * 1000 * 3600 * 24; //ms
      break;
    }
  }
  // let endDate: number = startDate + 1000 * 3600 * 24 * 6; //ms

  //第幾週
  let week: number | string = Math.floor(1 + (startDate - firstDate.getTime()) / (1000 * 3600 * 24 * 7));
  if (week === 0) {
    const adjustedDate: Date = await getAdjustedDate(date);
    return await getWeekString(adjustedDate);
  } else {
    week = week < 10 ? '0' + week : week.toString();
    return new Date(startDate).getFullYear() + week;
  }
};

/**
 * @description 獲取每一年第一週的起算日
 * @param { number } year: 西元年 (yyyy)
 * @returns { Date } 當年度第一週起算日
 */
const getFirstDateOfYear = (year: number): Date => {
  //先預設起算日為 01/01
  const defaultDate = `${year}/01/01`;
  const defaultDay = new Date(defaultDate).getDay();
  const defaultDatetime = new Date(defaultDate).getTime();

  let resultDate: Date;
  //如果預設的起算日 (yyyy/01/01) 不是禮拜一, 要再尋找正確的起算日
  const adjustTime = 8 * 1000 * 3600;
  if (defaultDay !== 1) {
    switch (defaultDay) {
      case 0: {
        resultDate = new Date(defaultDatetime + 1000 * 3600 * 24 + adjustTime);
        break;
      }
      default: {
        resultDate = new Date(defaultDatetime + (7 + 1 - defaultDay) * 1000 * 3600 * 24 + adjustTime);
        break;
      }
    }
  } else {
    resultDate = new Date(defaultDatetime + adjustTime);
  }
  return resultDate;
};

/**
 * @description 修正 getWeekString() 回傳的 week 值為 0 的問題, 會將傳入的日期參數進行校正
 * @param { Date } dateToAdjust: 待校正的日期
 * @returns { Date } 校正過後的日期
 */
const getAdjustedDate = async (dateToAdjust: Date): Promise<Date> => {
  const datetimeToAdjust = new Date(dateToAdjust).getTime() - 3600 * 1000 * 24;
  const adjustedDate = new Date(datetimeToAdjust);

  return adjustedDate;
};
