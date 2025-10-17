import { jest } from '@jest/globals'

// Mock the redis client
const mockClient = {
  get: jest.fn()
}

// Mock the redisconnection module
jest.unstable_mockModule('../src/redisconnection.js', () => ({
  client: mockClient
}))

const { getAccounts } = await import('../src/accounts.js')

describe('accounts.js', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAccounts', () => {
    it('should return parsed JSON when accounts exist in Redis', async () => {
      const mockAccounts = [
        {
          id: 1,
          host: 'mail.example.com',
          protocol: 'IMAP',
          port: 993,
          username: 'user@example.com',
          password: 'password123',
          ssl: true,
          verifySsl: true,
          user: 'localuser'
        }
      ]

      mockClient.get.mockResolvedValue(JSON.stringify(mockAccounts))

      const result = await getAccounts()

      expect(mockClient.get).toHaveBeenCalledWith('fetchmail_accounts')
      expect(result).toEqual(mockAccounts)
    })

    it('should return false when no accounts found in Redis', async () => {
      mockClient.get.mockResolvedValue(null)

      const result = await getAccounts()

      expect(mockClient.get).toHaveBeenCalledWith('fetchmail_accounts')
      expect(result).toBe(false)
    })

    it('should return false when Redis returns empty string', async () => {
      mockClient.get.mockResolvedValue('')

      const result = await getAccounts()

      expect(mockClient.get).toHaveBeenCalledWith('fetchmail_accounts')
      expect(result).toBe(false)
    })

    it('should handle multiple accounts', async () => {
      const mockAccounts = [
        {
          id: 1,
          host: 'mail1.example.com',
          protocol: 'IMAP',
          port: 993,
          username: 'user1@example.com',
          password: 'password1',
          ssl: true,
          verifySsl: true,
          user: 'localuser1'
        },
        {
          id: 2,
          host: 'mail2.example.com',
          protocol: 'POP3',
          port: 995,
          username: 'user2@example.com',
          password: 'password2',
          ssl: true,
          verifySsl: false,
          user: 'localuser2'
        }
      ]

      mockClient.get.mockResolvedValue(JSON.stringify(mockAccounts))

      const result = await getAccounts()

      expect(result).toEqual(mockAccounts)
      expect(result).toHaveLength(2)
    })

    it('should throw error when JSON parsing fails', async () => {
      mockClient.get.mockResolvedValue('invalid json')

      await expect(getAccounts()).rejects.toThrow()
    })

    it('should throw error when Redis client throws', async () => {
      const mockError = new Error('Redis connection failed')
      mockClient.get.mockRejectedValue(mockError)

      await expect(getAccounts()).rejects.toThrow('Redis connection failed')
    })

    it('should handle empty accounts array', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify([]))

      const result = await getAccounts()

      expect(result).toEqual([])
    })
  })
})
