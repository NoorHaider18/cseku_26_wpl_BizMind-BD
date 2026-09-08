import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;

  const dto = {
    businessId: 'biz-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'supersecret1',
    role: 'staff' as const,
  };

  beforeEach(() => {
    service = new UsersService();
  });

  it('creates a user with a hashed password and a generated id', async () => {
    const user = await service.create(dto);
    expect(user.id).toBeTypeOf('string');
    expect(user.passwordHash).not.toBe(dto.password);
  });

  it('prevents duplicate emails (case-insensitive)', async () => {
    await service.create(dto);
    await expect(service.create({ ...dto, email: 'JANE@example.com' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('finds a user by email case-insensitively', async () => {
    await service.create(dto);
    expect(service.findByEmail('JANE@EXAMPLE.COM')).toBeDefined();
  });

  it('toSafeUser strips the password hash', async () => {
    const user = await service.create(dto);
    const safe = service.toSafeUser(user);
    expect(safe).not.toHaveProperty('passwordHash');
    expect(safe.email).toBe(dto.email);
  });

  it('returns undefined for a non-existent id', () => {
    expect(service.findById('does-not-exist')).toBeUndefined();
  });

  it('removes a user by id', async () => {
    const user = await service.create(dto);
    expect(service.remove(user.id)).toBe(true);
    expect(service.findById(user.id)).toBeUndefined();
  });
});
