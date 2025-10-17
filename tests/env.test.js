import { jest } from '@jest/globals'

// Mock process.env before importing the module
const originalEnv = process.env

describe('env.js', () => {
  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv }
    // Set required environment variable for tests
    process.env.FETCHMAIL_SMTP_ADDRESS = 'test-smtp:587'
  })

  afterAll(() => {
    // Restore original process.env after all tests
    process.env = originalEnv
  })

  describe('FETCHMAIL_SMTP_ADDRESS', () => {
    it('should throw error when FETCHMAIL_SMTP_ADDRESS is not set', async () => {
      delete process.env.FETCHMAIL_SMTP_ADDRESS

      // Clear module cache to force re-import
      jest.resetModules()

      await expect(async () => {
        await import('../src/env.js')
      }).rejects.toThrow('FETCHMAIL_SMTP_ADDRESS environment variable is required')
    })

    it('should return the value when FETCHMAIL_SMTP_ADDRESS is set', async () => {
      process.env.FETCHMAIL_SMTP_ADDRESS = 'smtp.example.com'

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_SMTP_ADDRESS } = await import('../src/env.js')
      expect(FETCHMAIL_SMTP_ADDRESS).toBe('smtp.example.com')
    })

    it('should replace colons with slashes in FETCHMAIL_SMTP_ADDRESS', async () => {
      process.env.FETCHMAIL_SMTP_ADDRESS = 'smtp.example.com:587'

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_SMTP_ADDRESS } = await import('../src/env.js')
      expect(FETCHMAIL_SMTP_ADDRESS).toBe('smtp.example.com/587')
    })

    it('should replace multiple colons with slashes', async () => {
      process.env.FETCHMAIL_SMTP_ADDRESS = 'host:port:extra'

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_SMTP_ADDRESS } = await import('../src/env.js')
      expect(FETCHMAIL_SMTP_ADDRESS).toBe('host/port/extra')
    })
  })

  describe('FETCHMAIL_USE_LMTP', () => {
    it('should be false when FETCHMAIL_USE_LMTP is not set', async () => {
      delete process.env.FETCHMAIL_USE_LMTP

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_USE_LMTP } = await import('../src/env.js')
      expect(FETCHMAIL_USE_LMTP).toBe(false)
    })

    it('should be true when FETCHMAIL_USE_LMTP is "true"', async () => {
      process.env.FETCHMAIL_USE_LMTP = 'true'

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_USE_LMTP } = await import('../src/env.js')
      expect(FETCHMAIL_USE_LMTP).toBe(true)
    })

    it('should be false when FETCHMAIL_USE_LMTP is "false"', async () => {
      process.env.FETCHMAIL_USE_LMTP = 'false'

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_USE_LMTP } = await import('../src/env.js')
      expect(FETCHMAIL_USE_LMTP).toBe(false)
    })

    it('should be false when FETCHMAIL_USE_LMTP is any other value', async () => {
      process.env.FETCHMAIL_USE_LMTP = 'yes'

      // Clear module cache to force re-import
      jest.resetModules()

      const { FETCHMAIL_USE_LMTP } = await import('../src/env.js')
      expect(FETCHMAIL_USE_LMTP).toBe(false)
    })
  })

  describe('other environment variables', () => {
    it('should have default values for optional variables', async () => {
      // Clear module cache to force re-import
      jest.resetModules()

      const env = await import('../src/env.js')
      expect(env.REDIS_URL).toBe('redis://localhost:6379')
      expect(env.FETCHMAIL_PATH).toBe('/usr/bin/fetchmail')
      expect(env.TEMP_DIR).toBe('/tmp')
    })

    it('should use environment values when set', async () => {
      process.env.REDIS_URL = 'redis://custom:6379'
      process.env.FETCHMAIL_PATH = '/custom/fetchmail'
      process.env.TEMP_DIR = '/custom/temp'

      // Clear module cache to force re-import
      jest.resetModules()

      const env = await import('../src/env.js')
      expect(env.REDIS_URL).toBe('redis://custom:6379')
      expect(env.FETCHMAIL_PATH).toBe('/custom/fetchmail')
      expect(env.TEMP_DIR).toBe('/custom/temp')
    })
  })
})
