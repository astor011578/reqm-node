import { SetupServer } from './server';

enum ExitStatus {
  Failure = 1,
  Success = 0
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Error] App exiting due to an unhandled promise:');
  console.error(promise);
  console.error('\n[Error] and reason:');
  console.error(reason);
  //throw the error and let the uncaughtException handle below handle it
  throw reason;
});

process.on('uncaughtException', (error) => {
  console.error('[Error] App exiting due to an uncaught exception:');
  console.error(error);
  process.exit(ExitStatus.Failure);
});

(async (): Promise<void> => {
  try {
    const server = new SetupServer();
    await server.init();
    server.start();

    const exitSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    for (const exitSignal of exitSignals) {
      process.on(exitSignal, async () => {
        try {
          await server.close();
          console.info('[Info] App exited with success');
          process.exit(ExitStatus.Success);

        } catch (error) {
          console.error('[Error] App exited with error:');
          console.error(error);
          process.exit(ExitStatus.Failure);
        }
      });
    }

  } catch (error) {
    console.error('[Error] App exited with error:');
    console.error(error);
    process.exit(ExitStatus.Failure);
  }
})();
