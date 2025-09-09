// Web API polyfills for MSW - MUST be at the top before any imports
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream } = require('web-streams-polyfill')

// Apply polyfills to global scope
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream

// Polyfill fetch and related APIs
require('whatwg-fetch')

// MSW requires these to be available
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map(Object.entries(init.headers || {}))
    }
    json() { return Promise.resolve(JSON.parse(this.body)) }
    text() { return Promise.resolve(this.body) }
  }
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = Map
}

import '@testing-library/jest-dom'
import { server } from './mocks/server'

// MSW (Mock Service Worker) の設定
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 環境変数のモック
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'

// IntersectionObserverのモック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ResizeObserverのモック
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// fetch のモック
global.fetch = jest.fn()

// window.location のモック
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  hostname: 'localhost',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// console.error を静音化（必要に応じて）
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})