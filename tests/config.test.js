import { jest } from '@jest/globals'

// Mock the env module
jest.unstable_mockModule('../src/env.js', () => ({
  FETCHMAIL_SMTP_ADDRESS: 'smtp.example.com',
  FETCHMAIL_USE_LMTP: false,
  TEMP_DIR: '/tmp'
}))

const { getPath, getConfigPath } = await import('../src/config.js')

describe('config.js', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('getPath', () => {
    it('should return correct path for account ID', () => {
      const result = getPath(123)
      expect(result).toBe('/tmp/123')
    })

    it('should handle string account ID', () => {
      const result = getPath('456')
      expect(result).toBe('/tmp/456')
    })
  })

  describe('getConfigPath', () => {
    it('should return correct config file path for account ID', () => {
      const result = getConfigPath(123)
      expect(result).toBe('/tmp/123/.fetchmailrc')
    })

    it('should handle string account ID', () => {
      const result = getConfigPath('456')
      expect(result).toBe('/tmp/456/.fetchmailrc')
    })
  })

  describe('config generation', () => {
    it('should generate correct paths', () => {
      const accountId = 123
      const expectedPath = '/tmp/123'
      const expectedConfigPath = '/tmp/123/.fetchmailrc'

      expect(getPath(accountId)).toBe(expectedPath)
      expect(getConfigPath(accountId)).toBe(expectedConfigPath)
    })

    it('should handle string account IDs', () => {
      const accountId = '456'
      const expectedPath = '/tmp/456'
      const expectedConfigPath = '/tmp/456/.fetchmailrc'

      expect(getPath(accountId)).toBe(expectedPath)
      expect(getConfigPath(accountId)).toBe(expectedConfigPath)
    })
  })
})
