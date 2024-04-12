import mongoose from 'mongoose';
const { connection } = mongoose;
const mongooseConnect = mongoose.connect;
mongoose.set('strictQuery', false);

import { getEnv } from '@/util/env-variables';
const ENV: string = getEnv('NODE_ENV');

//information about prod environment
const PWD: string = getEnv('PASSWORD');
const ACC: string = getEnv('ACCOUNT');
const ADDR: string = getEnv('ADDRESS');
const NAME: string = getEnv('DB_NAME');
const SIZE: number = 10; //connection pool size

const devUri: string = `mongodb://127.0.0.1:27017/${NAME}?maxPoolSize=${SIZE}`;
const prodUri: string = `mongodb+srv://${ACC}:${PWD}@${NAME}.${ADDR}/?retryWrites=true&w=majority`;
const URI: string = ENV === 'dev' ? devUri : prodUri;

export const connect = async (): Promise<void> => {
  await mongooseConnect(URI)
    .then(() => {
      const db = connection;
      console.log(`[Info] Connect to ${ENV} database`);
      db.on('error', (error) => {
        throw error;
      });
    })
    .catch((error) => {
      const log = console.error.bind(console, '[Error] DB connection error:\n');
      log(error);
    });
};

export const close = (): Promise<void> => connection.close();
