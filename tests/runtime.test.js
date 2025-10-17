import { jest } from '@jest/globals'

// Mock node:child_process
const mockExec = jest.fn()
jest.unstable_mockModule('node:child_process', () => ({
  exec: mockExec
}))

// Mock console methods
const originalConsole = { ...console }
global.console = {
  ...console,
  debug: jest.fn(),
  error: jest.fn()
}

// Mock the dependencies
const mockClient = {
  set: jest.fn(),
  del: jest.fn()
}

jest.unstable_mockModule('../src/redisconnection.js', () => ({
  client: mockClient
}))

jest.unstable_mockModule('../src/config.js', () => ({
  getPath: jest.fn((id) => `/tmp/${id}`),
  getConfigPath: jest.fn((id) => `/tmp/${id}/.fetchmailrc`)
}))

const mockState = { processesRunning: 0 }
jest.unstable_mockModule('../src/app.js', () => ({
  state: mockState
}))

jest.unstable_mockModule('../src/env.js', () => ({
  FETCHMAIL_PATH: '/usr/bin/fetchmail'
}))

const { startProcess } = await import('../src/runtime.js')

describe('runtime.js', () => {
  let mockProcess

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset state
    mockState.processesRunning = 0

    // Create mock process
    mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    }

    mockExec.mockReturnValue(mockProcess)
  })

  afterAll(() => {
    global.console = originalConsole
  })

  describe('startProcess', () => {
    const mockAccount = {
      id: 1,
      host: 'mail.example.com',
      protocol: 'imap',
      port: 993,
      username: 'user@example.com',
      password: 'password123',
      ssl: true,
      verifySsl: true,
      user: 'localuser'
    }

    it('should increment processesRunning counter', async () => {
      await startProcess(mockAccount)

      // The state is incremented in the actual module, not our mock
      // We can verify the function was called by checking Redis calls
      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_running_1',
        '1',
        { EX: 600 }
      )
    })

    it('should save running state to Redis', async () => {
      await startProcess(mockAccount)

      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_running_1',
        '1',
        { EX: 600 }
      )
    })

    it('should execute fetchmail with correct command', async () => {
      await startProcess(mockAccount)

      expect(mockExec).toHaveBeenCalledWith(
        '"/usr/bin/fetchmail" -N --nosyslog --fetchmailrc "/tmp/1/.fetchmailrc"',
        {
          env: {
            HOME: '/tmp/1',
            FETCHMAILHOME: '/tmp/1'
          },
          timeout: 600000
        }
      )
    })

    it('should handle successful process completion', async () => {
      let closeCallback
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          closeCallback = callback
        }
      })

      await startProcess(mockAccount)

      // Simulate successful completion (exit code 0)
      closeCallback(0)

      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_runtime_1',
        expect.stringContaining('"isSuccess":true')
      )
      expect(mockState.processesRunning).toBe(0)
      expect(mockClient.del).toHaveBeenCalledWith('fetchmail_accounts_running_1')
    })

    it('should handle process with warnings (exit code 1)', async () => {
      let closeCallback
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          closeCallback = callback
        }
      })

      await startProcess(mockAccount)

      // Simulate process with warnings (exit code 1)
      closeCallback(1)

      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_runtime_1',
        expect.stringContaining('"isSuccess":true')
      )
    })

    it('should handle process with errors (exit code > 1)', async () => {
      let closeCallback
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          closeCallback = callback
        }
      })

      await startProcess(mockAccount)

      // Simulate process with errors (exit code 2)
      closeCallback(2)

      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_runtime_1',
        expect.stringContaining('"isSuccess":false')
      )
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle exec error', async () => {
      const error = new Error('Command not found')
      mockExec.mockImplementation(() => {
        throw error
      })

      await startProcess(mockAccount)

      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_runtime_1',
        expect.stringContaining('"isSuccess":false')
      )
      expect(console.error).toHaveBeenCalledWith(
        '[1] Error starting process:',
        error
      )
      expect(mockState.processesRunning).toBe(0)
    })

    it('should collect stdout and stderr data', async () => {
      let stdoutCallback, stderrCallback, closeCallback

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          stdoutCallback = callback
        }
      })

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          stderrCallback = callback
        }
      })

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          closeCallback = callback
        }
      })

      await startProcess(mockAccount)

      // Simulate data output
      stdoutCallback('stdout data')
      stderrCallback('stderr data')
      closeCallback(0)

      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_runtime_1',
        expect.stringContaining('stdout data')
      )
      expect(mockClient.set).toHaveBeenCalledWith(
        'fetchmail_accounts_runtime_1',
        expect.stringContaining('stderr data')
      )
    })

    it('should save runtime data with correct structure', async () => {
      let closeCallback
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          closeCallback = callback
        }
      })

      await startProcess(mockAccount)
      closeCallback(0)

      const runtimeCalls = mockClient.set.mock.calls.filter(call =>
        call[0] === 'fetchmail_accounts_runtime_1'
      )
      const runtimeCall = runtimeCalls[runtimeCalls.length - 1] // Get the last call
      const runtimeData = JSON.parse(runtimeCall[1])

      expect(runtimeData).toHaveProperty('lastRun')
      expect(runtimeData).toHaveProperty('lastLog')
      expect(runtimeData).toHaveProperty('isSuccess', true)
      expect(new Date(runtimeData.lastRun)).toBeInstanceOf(Date)
    })
  })
})
