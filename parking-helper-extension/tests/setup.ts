import '@testing-library/jest-dom';

// Mock chrome API
global.chrome = {
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    openOptionsPage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
} as any;