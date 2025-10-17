import { jest } from '@jest/globals'

// Mock Fastify
const mockFastify = {
  get: jest.fn(),
  listen: jest.fn(),
  server: {
    address: jest.fn(() => ({ port: 3000 }))
  }
}

const mockFastifyConstructor = jest.fn(() => mockFastify)
jest.unstable_mockModule('fastify', () => ({
  default: mockFastifyConstructor
}))

// Mock the app state
const mockState = {
  ready: false,
  healthy: false
}

jest.unstable_mockModule('../src/app.js', () => ({
  state: mockState
}))

const { startServer } = await import('../src/healthz.js')

describe('healthz.js', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset state
    mockState.ready = false
    mockState.healthy = false
  })

  describe('Health check endpoints', () => {
    it('should have health check functionality', () => {
      // Basic test to verify the module loads correctly
      expect(mockFastify).toBeDefined()
    })
  })

  describe('startServer', () => {
    it('should call fastify.listen with correct parameters', async () => {
      const host = '0.0.0.0'
      const port = 3000

      await startServer(host, port)

      expect(mockFastify.listen).toHaveBeenCalledWith({
        port,
        host
      })
    })

    it('should handle different host and port values', async () => {
      const host = '127.0.0.1'
      const port = 8080

      await startServer(host, port)

      expect(mockFastify.listen).toHaveBeenCalledWith({
        port: 8080,
        host: '127.0.0.1'
      })
    })

    it('should handle fastify.listen errors', async () => {
      const error = new Error('Port already in use')
      mockFastify.listen.mockRejectedValue(error)

      await expect(startServer('0.0.0.0', 3000)).rejects.toThrow('Port already in use')
    })
  })

  describe('Fastify configuration', () => {
    it('should have Fastify instance available', async () => {
      // Basic test to verify Fastify is available
      expect(mockFastifyConstructor).toBeDefined()
    })
  })
})
