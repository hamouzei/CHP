import { scanBuffer } from '../services/antivirus';
import * as net from 'net';

jest.mock('net');

describe('antivirus service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should fallback to clean scan when CLAMAV_HOST is not configured', async () => {
    delete process.env.CLAMAV_HOST;
    const result = await scanBuffer(Buffer.from('test'));
    expect(result.clean).toBe(true);
    expect(result.message).toContain('No CLAMAV_HOST configured');
  });

  it('should return clean when ClamAV responds with OK', async () => {
    process.env.CLAMAV_HOST = '127.0.0.1:3310';
    
    // Mock net.createConnection
    const mockSocket = {
      write: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn().mockImplementation(function (this: any, event, callback) {
        if (event === 'connect') {
          // Immediately trigger connect
          setTimeout(() => callback(), 10);
        }
        if (event === 'close') {
          // Trigger close after sending data
          setTimeout(() => callback(), 50);
        }
        return this;
      }),
    };

    (net.createConnection as jest.Mock).mockReturnValue(mockSocket);

    // Simulate "stream: OK" data received
    mockSocket.on.mockImplementation(function (this: any, event, callback) {
      if (event === 'connect') {
        setTimeout(() => callback(), 10);
      }
      if (event === 'data') {
        setTimeout(() => callback(Buffer.from('stream: OK\n')), 30);
      }
      if (event === 'close') {
        setTimeout(() => callback(), 50);
      }
      return this;
    });

    const result = await scanBuffer(Buffer.from('clean-buffer'));
    expect(result.clean).toBe(true);
    expect(result.message).toBe('stream: OK');
  });

  it('should return infected when ClamAV responds with FOUND', async () => {
    process.env.CLAMAV_HOST = '127.0.0.1:3310';
    
    const mockSocket = {
      write: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn(),
    };

    (net.createConnection as jest.Mock).mockReturnValue(mockSocket);

    mockSocket.on.mockImplementation(function (this: any, event, callback) {
      if (event === 'connect') {
        setTimeout(() => callback(), 10);
      }
      if (event === 'data') {
        setTimeout(() => callback(Buffer.from('stream: Eicar-Test-Signature FOUND\n')), 30);
      }
      if (event === 'close') {
        setTimeout(() => callback(), 50);
      }
      return this;
    });

    const result = await scanBuffer(Buffer.from('infected-buffer'));
    expect(result.clean).toBe(false);
    expect(result.message).toBe('stream: Eicar-Test-Signature FOUND');
  });

  it('should bypass scan (return clean) if connection fails or times out (development resilience)', async () => {
    process.env.CLAMAV_HOST = 'clamav.internal:3310';
    
    const mockSocket = {
      write: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn(),
    };

    (net.createConnection as jest.Mock).mockReturnValue(mockSocket);

    mockSocket.on.mockImplementation(function (this: any, event, callback) {
      if (event === 'error') {
        // Trigger error
        setTimeout(() => callback(new Error('Connection refused')), 10);
      }
      return this;
    });

    const result = await scanBuffer(Buffer.from('any-buffer'));
    expect(result.clean).toBe(true);
    expect(result.message).toContain('ClamAV unreachable');
  });
});
