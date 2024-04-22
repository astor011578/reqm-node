# 定義當前運行 Node.js 的版本 (p.s. alpine 為瘦身檔案用)
#FROM node:18-alpine
FROM node:18

# 在容器中運行時應用程式的目錄
WORKDIR /usr/src/app

# 為了將 Node.js 運行起來，將 package.json 複製至 ./ 目錄之下
COPY package*.json ./

# 運行應用程式之前建置環境的指令
RUN npm install pnpm ts-node -g
RUN pnpm install

# 將當前目錄 (.) 複製到 docker 環境之下的目錄 (.)
COPY . .

# 由於此專案使用 TypeScript，需要先將 .ts 檔編譯為 .js
RUN npm run build

# 暴露應用的 port
EXPOSE 7000

# 環境運行的指令
CMD ["npm", "run", "prod"]
