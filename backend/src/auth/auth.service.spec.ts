import { describe, it, expect, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  const testUser = {
    businessId: 'biz-1',
    name: 'Test Owner',
    email: 'owner@example.com',
    password: 'password123',
    role: 'owner' as const,
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
      providers: [AuthService, UsersService],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
  });

  describe('register', () => {
    it('creates a user and returns an access token + safe user payload', async () => {
      const result = await authService.register(testUser);

      expect(result.accessToken).toBeTypeOf('string');
      expect(result.user.email).toBe(testUser.email);
      // password / passwordHash must never appear in the response
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a duplicate email', async () => {
      await authService.register(testUser);
      await expect(authService.register(testUser)).rejects.toThrow(ConflictException);
    });

    it('stores the password hashed, not in plaintext', async () => {
      await authService.register(testUser);
      const stored = usersService.findByEmail(testUser.email);
      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toBe(testUser.password);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(testUser);
    });

    it('logs in with correct credentials', async () => {
      const result = await authService.login({
        email: testUser.email,
        password: testUser.password,
      });
      expect(result.accessToken).toBeTypeOf('string');
      expect(result.user.email).toBe(testUser.email);
    });

    it('rejects an unknown email', async () => {
      await expect(
        authService.login({ email: 'nobody@example.com', password: 'whatever123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      await expect(
        authService.login({ email: testUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an empty password against a real account', async () => {
      await expect(
        authService.login({ email: testUser.email, password: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
