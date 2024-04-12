import logModel from '@/models/logs';

/**
 * @description 紀錄來自 server 產生的 error message
 * @param { string } $fileName 發生此錯誤的來源檔案名稱
 * @param { object } $error 程式拋出的 error message
 */
export const errorLogger = async ($fileName: string, $error: object): Promise<void> => {
  console.error('[Error] Some error just occured, please refer `logs` collection');
  try {
    await logModel.insertMany({
      type: 'error',
      fileName: $fileName,
      error: $error,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error(error);
  }
};
