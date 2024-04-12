export type TServerLog = {
  type: 'info' | 'error';
  info?: object;
  fileName?: string;
  error?: object;
  timestamp: Date;
};
