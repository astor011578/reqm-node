const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

/**
 * @description 產生 key pair, 執行函式的方法請使用 pnpm run keygen 指令, 匯出的 key pair 會存入專案根目錄下的 /exports
 */
const generateKeyPair = () => {
  //1. 產生 key pair
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 4096 });
  const privateKeyStr = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const publicKeyStr = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  //2. 寫入檔案
  const today = new Date().getTime();
  const filePath = `exports/keygen_${today}.txt`;
  const data = `${privateKeyStr}\n${publicKeyStr}`;
  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`[Info] 產生密鑰成功, 請查看 ${filePath} 檔案`);
    };
  });
};

generateKeyPair();
