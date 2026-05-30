import { getKeys } from '../config/keys';
import * as jwt from 'jsonwebtoken';

describe('JWT Asymmetric RS256 Authentication', () => {
  it('should generate or load valid RSA public and private key-pairs', () => {
    const { privateKey, publicKey } = getKeys();
    
    expect(privateKey).toBeDefined();
    expect(publicKey).toBeDefined();
    
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
  });

  it('should successfully sign a payload using RS256 and verify it', () => {
    const { privateKey, publicKey } = getKeys();
    
    const payload = { userId: 'test-user-id', role: 'assessor', orgId: 'org-id' };
    
    // Sign token
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1h' });
    
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3); // Header, Payload, Signature

    // Verify token
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as typeof payload;
    
    expect(decoded.userId).toBe('test-user-id');
    expect(decoded.role).toBe('assessor');
    expect(decoded.orgId).toBe('org-id');
  });

  it('should throw an error when verifying a token with an invalid public key or modified signature', () => {
    const { privateKey } = getKeys();
    const payload = { userId: 'another-user' };
    
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    
    // Tamper with the token signature
    const tamperedToken = token.slice(0, -10) + 'invalidpep';
    
    const { publicKey } = getKeys();
    
    expect(() => {
      jwt.verify(tamperedToken, publicKey, { algorithms: ['RS256'] });
    }).toThrow();
  });
});
