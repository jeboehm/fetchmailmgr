import { connect as connectRedis } from './redisconnection.js';
import * as commander from 'commander';
import { startServer } from './healthz.js';
import { exit, loop, state } from './app.js';

process.on('SIGINT', function () {
  console.log('Caught interrupt signal');

  exit();
});

const program = new commander.Command();
program.version('1.0.0');
program.option('-d, --debug', 'output extra debugging');
program.option(
  '-i --interval <interval>',
  'interval in seconds to run fetchmail',
  (value) => parseInt(value),
  60,
);
program.option(
  '-s --server <server>',
  'host to listen for health check requests',
  '0.0.0.0',
);
program.option(
  '-p --port <port>',
  'port to listen for health check requests',
  (value) => parseInt(value),
  3000,
);
program.description(
  'fetchmailmgr is a bridge between fetchmail and docker-mailserver',
);
program.parse(process.argv);
const options = program.opts();

if (!options.debug) {
  console.debug = () => {};
}

const main = async () => {
  await connectRedis();
  await startServer(options.server, options.port);
  state.healthy = true;

  setInterval(loop, 1000 * options.interval);

  await loop();
};

try {
  console.info('Starting fetchmailmgr');

  await main();
} catch (err) {
  console.error('Error in main loop', err);
  exit(true);
}
