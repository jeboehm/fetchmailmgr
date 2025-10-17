import { jest } from '@jest/globals'

// Mock console methods
const originalConsole = { ...console }
global.console = {
  ...console,
  info: jest.fn(),
  error: jest.fn()
}

// Mock the dependencies
const mockGetAccounts = jest.fn()
const mockSyncConfig = jest.fn()
const mockStartProcess = jest.fn()

jest.unstable_mockModule('../src/accounts.js', () => ({
  getAccounts: mockGetAccounts
}))

jest.unstable_mockModule('../src/config.js', () => ({
  sync: mockSyncConfig
}))

jest.unstable_mockModule('../src/runtime.js', () => ({
  startProcess: mockStartProcess
}))

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called')
})

// Mock setTimeout
jest.useFakeTimers()

const { state, loop, exit } = await import('../src/app.js')

describe('app.js', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset state
    state.processesRunning = 0
    state.ready = false
    state.healthy = false
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
    global.console = originalConsole
    mockExit.mockRestore()
  })

  describe('state', () => {
    it('should have initial state values', () => {
      expect(state).toHaveProperty('processesRunning', 0)
      expect(state).toHaveProperty('ready', false)
      expect(state).toHaveProperty('healthy', false)
    })
  })

  describe('loop', () => {
    it('should set ready to true', async () => {
      mockGetAccounts.mockResolvedValue(false)

      await loop()

      expect(state.ready).toBe(true)
    })

    it('should handle no accounts found', async () => {
      mockGetAccounts.mockResolvedValue(false)

      await loop()

      expect(console.info).toHaveBeenCalledWith('No accounts found in redis, sleeping...')
      expect(mockSyncConfig).not.toHaveBeenCalled()
      expect(mockStartProcess).not.toHaveBeenCalled()
    })

    it('should process accounts when found', async () => {
      const mockAccounts = [
        { id: 1, host: 'mail1.example.com' },
        { id: 2, host: 'mail2.example.com' }
      ]
      mockGetAccounts.mockResolvedValue(mockAccounts)

      await loop()

      expect(console.info).toHaveBeenCalledWith('Running fetchmail loop over 2 accounts')
      expect(mockSyncConfig).toHaveBeenCalledTimes(2)
      expect(mockSyncConfig).toHaveBeenCalledWith(mockAccounts[0])
      expect(mockSyncConfig).toHaveBeenCalledWith(mockAccounts[1])
      expect(mockStartProcess).toHaveBeenCalledTimes(2)
      expect(mockStartProcess).toHaveBeenCalledWith(mockAccounts[0])
      expect(mockStartProcess).toHaveBeenCalledWith(mockAccounts[1])
    })

    it('should handle single account', async () => {
      const mockAccounts = [{ id: 1, host: 'mail.example.com' }]
      mockGetAccounts.mockResolvedValue(mockAccounts)

      await loop()

      expect(console.info).toHaveBeenCalledWith('Running fetchmail loop over 1 accounts')
      expect(mockSyncConfig).toHaveBeenCalledTimes(1)
      expect(mockStartProcess).toHaveBeenCalledTimes(1)
    })

    it('should handle getAccounts error', async () => {
      const error = new Error('Redis connection failed')
      mockGetAccounts.mockRejectedValue(error)

      await expect(loop()).rejects.toThrow('Redis connection failed')
    })
  })

  describe('exit', () => {
    it('should exit immediately when no processes are running', () => {
      state.processesRunning = 0

      expect(() => exit()).toThrow('process.exit called')
      expect(mockExit).toHaveBeenCalledWith(0)
      expect(state.ready).toBe(false)
      expect(state.healthy).toBe(false)
    })

    it('should exit with error when withError is true', () => {
      state.processesRunning = 0

      expect(() => exit(true)).toThrow('process.exit called')
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should wait for processes to finish', () => {
      state.processesRunning = 1

      exit()

      expect(console.info).toHaveBeenCalledWith(
        'Waiting for processes to finish... (tries: 1/10)'
      )
      expect(mockExit).not.toHaveBeenCalled()

      // Fast-forward time to trigger the recursive call
      jest.advanceTimersByTime(1000)

      expect(console.info).toHaveBeenCalledWith(
        'Waiting for processes to finish... (tries: 2/10)'
      )
    })

    it('should force quit after max tries', () => {
      state.processesRunning = 1

      expect(() => {
        exit()
        // Fast-forward through all the retries
        for (let i = 0; i < 10; i++) {
          jest.advanceTimersByTime(1000)
        }
      }).toThrow('process.exit called')

      expect(console.error).toHaveBeenCalledWith(
        'Processes did not finish in time, force quitting...'
      )
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should exit when processes finish during wait', () => {
      state.processesRunning = 1

      expect(() => {
        exit()

        // First call shows waiting message
        expect(console.info).toHaveBeenCalledWith(
          'Waiting for processes to finish... (tries: 1/10)'
        )

        // Simulate processes finishing
        state.processesRunning = 0

        // Fast-forward time to trigger the recursive call
        jest.advanceTimersByTime(1000)
      }).toThrow('process.exit called')

      expect(console.info).toHaveBeenCalledWith('Exiting...')
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should handle multiple exit calls with different error states', () => {
      state.processesRunning = 0

      // Test with error
      expect(() => exit(true, 5)).toThrow('process.exit called')
      expect(mockExit).toHaveBeenCalledWith(1)

      // Reset mock
      mockExit.mockClear()

      // Test without error
      expect(() => exit(false, 3)).toThrow('process.exit called')
      expect(mockExit).toHaveBeenCalledWith(0)
    })
  })
})
