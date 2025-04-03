import { connect as connectRedis } from './redisconnection.js'
import * as commander from 'commander'
import { startServer } from './healthz.js'
import { exit, loop, state } from './app.js'
import { DEBUG } from './env.js'

const createProcessListeners = () => {
  process.on('SIGINT', function () {
    console.log('Caught interrupt signal')

    exit()
  })

  process.on('SIGTERM', function () {
    console.log('Caught termination signal')

    exit()
  })
}

const setupConsole = (debug) => {
  if (!debug) {
    console.debug = () => {}
  }
}

const setupCommander = () => {
  const program = new commander.Command()
  program.option('-d, --debug', 'output extra debugging')
  program.option(
    '-i --interval <interval>',
    'interval in seconds to run fetchmail',
    (value) => parseInt(value),
    60
  )
  program.option(
    '-s --server <server>',
    'host to listen for health check requests',
    '0.0.0.0'
  )
  program.option(
    '-p --port <port>',
    'port to listen for health check requests',
    (value) => parseInt(value),
    3000
  )
  program.description(`fetchmailmgr is a bridge between fetchmail and docker-mailserver. It fetches emails from external mail providers
and delivers them to the docker-mailserver. The configuration is managed by mailserver-admin, the management interface
for docker-mailserver.
`)
  program.parse(process.argv)

  return program
}

const main = async (server, port, interval) => {
  await connectRedis()
  await startServer(server, port)
  state.healthy = true

  setInterval(loop, 1000 * interval)

  await loop()
}

const program = setupCommander()
const options = program.opts()

createProcessListeners()
setupConsole(options.debug || DEBUG)

try {
  await main(options.server, options.port, options.interval)
} catch (err) {
  console.error('Error in main loop', err)
  exit(true)
}
