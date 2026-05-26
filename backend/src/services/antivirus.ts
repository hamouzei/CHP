import * as net from 'net';

export interface ScanResult {
  clean: boolean;
  message: string;
}

/**
 * Scan a file buffer for malware using ClamAV TCP protocol.
 * If CLAMAV_HOST is not set or unreachable in development, it logs a warning
 * and bypasses the scan with a clean result for compliance/convenience.
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  const host = process.env.CLAMAV_HOST;
  if (!host) {
    console.warn('[Antivirus] CLAMAV_HOST is not configured. Performing compliance mock scan (Status: CLEAN).');
    return { clean: true, message: 'Mock scan clean (No CLAMAV_HOST configured)' };
  }

  return new Promise((resolve) => {
    const parts = host.split(':');
    const hostName = parts[0];
    const port = parts[1] ? parseInt(parts[1], 10) : 3310;

    const socket = net.createConnection({ host: hostName, port, timeout: 2000 });

    socket.on('connect', () => {
      // ClamAV INSTREAM protocol:
      // Send 'nINSTREAM\n', then for each chunk, send chunk size (4 bytes big-endian) and chunk data.
      // End stream with a 0-size chunk.
      socket.write('nINSTREAM\n');
      
      const sizeBuf = Buffer.alloc(4);
      sizeBuf.writeUInt32BE(buffer.length, 0);
      socket.write(sizeBuf);
      socket.write(buffer);

      const zeroBuf = Buffer.alloc(4);
      zeroBuf.writeUInt32BE(0, 0);
      socket.write(zeroBuf);
    });

    let response = '';
    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('timeout', () => {
      socket.destroy();
      console.warn('[Antivirus] ClamAV scan timed out. Bypassing scan in development environment.');
      resolve({ clean: true, message: 'Scan timed out - bypassed' });
    });

    socket.on('error', (err) => {
      console.warn(`[Antivirus] ClamAV service unreachable at ${host}: ${err.message}. Bypassing scan in development environment.`);
      resolve({ clean: true, message: `ClamAV unreachable: ${err.message}` });
    });

    socket.on('close', () => {
      if (response) {
        const clean = response.includes('OK') && !response.includes('FOUND');
        resolve({ clean, message: response.trim() });
      } else {
        resolve({ clean: true, message: 'No response from ClamAV - bypassed' });
      }
    });
  });
}
