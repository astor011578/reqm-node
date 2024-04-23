## 此資料夾 (src/server) 主要是用來存放 HTTPS 伺服器所需要的私鑰、憑證
## 倘若您需要使用 HTTPS，請自行於此檔案所在路徑下，依照以下步驟生成私鑰與憑證：

1. 建立私鑰
```bash
# -out: 表示輸出的私鑰檔名為何，此處為 `server.key` (如果您有自定義其他輸出檔名，請記得至 src/server.ts 修改 KEY_PATH 常數)
# 2048 表示私鑰長度，您也可以設定為 1024
$openssl genrsa -out server.key 2048
```

2. 建立憑證要求
```bash
# -new: 表示要產生 CSR (certificate signing request)
# -key: 表示要讀取的私鑰名稱，此處為 `server.key`
# -out: 表示輸出的憑證要求檔名為何，此處為 `server.csr`
$openssl req -new -key server.key -out server.csr
```

3. 根據私鑰與憑證要求生成憑證
```bash
# x509: 是一種公開金鑰 (PKI) 的電信通訊標準
# -days: 憑證生效期限，預設為 30 天，此處為 9999 天
# -in: CSR 憑證要求的檔名，此處為 `server.csr`
# -signkey: 私鑰的檔名，此處為 `server.key`
# -out: 表示輸出的憑證檔名為何，此處為 `server.crt` (如果您有自定義其他輸出檔名，請記得至 src/server.ts 修改 CERT_PATH 常數)
$openssl x509 -req -days 9999 -in server.csr -signkey server.key -out server.crt
```

4. 如果以上 1. ~ 3. 步驟皆有成功，您會在專案資料夾底下的 `src/server` 底下看到三個新生成的檔案：
- server.key
- server.csr
- server.crt

5. 接下來請依正常方式啟動專案使用
