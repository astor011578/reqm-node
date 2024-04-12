1. 如果需要產生新的密鑰對，請使用以下指令：
```bash
# 請依照個人需求將 npm 改為 pnpm 抑或是其他套件管理工具
npm run keygen
```

2. 檔案會生成在專案根目錄下的 /exports 中
### 若此步驟發生錯誤，請手動建立 /exports 資料夾在根目錄之下

3. 請手動將生成的內容複製到專案根目錄下的 config.env，步驟如下：
### Private key:
  請從 **-----BEGIN PRIVATE KEY-----** 開始複製，一直複製到 **-----END PRIVATE KEY-----**，將其複製到 config.env 中的 **PRIVATE_KEY** 變數
### Public key:
  請從 **-----BEGIN PUBLIC KEY-----** 開始複製，一直複製到 **-----END PUBLIC KEY-----**，將其複製到 config.env 中的 **PUBLIC_KEY** 變數

4. 接下來請依正常方式啟動專案使用

