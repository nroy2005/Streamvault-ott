import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { AuthService } from './auth.service';

process.env.JWT_ACCESS_SECRET = 'test-access';
process.env.JWT_REFRESH_SECRET = 'test-refresh';

describe('AuthService', () => {
  // In-memory stand-in for the single user document.
  let stored: { id: string; email: string; passwordHash: string; refreshTokenHash: string | null } | null;
  let service: AuthService;

  beforeEach(() => {
    stored = null;
    const users = {
      exists: jest.fn(async () => (stored ? { _id: stored.id } : null)),
      create: jest.fn(async (doc: { email: string; passwordHash: string }) => {
        stored = { id: '507f1f77bcf86cd799439011', ...doc, refreshTokenHash: null };
        return stored;
      }),
      findOne: jest.fn(async () => stored),
      findById: jest.fn(async () => stored),
      updateOne: jest.fn(async (_: unknown, update: { refreshTokenHash: string }) => {
        if (stored) stored.refreshTokenHash = update.refreshTokenHash;
      }),
    };
    service = new AuthService(users as unknown as Model<User>, new JwtService());
  });

  it('hashes the password on register and returns tokens', async () => {
    const tokens = await service.register({ email: 'a@b.co', password: 'password123' });
    expect(tokens.accessToken).toBeTruthy();
    expect(stored?.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', stored!.passwordHash)).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    await service.register({ email: 'a@b.co', password: 'password123' });
    await expect(service.register({ email: 'a@b.co', password: 'password123' })).rejects.toThrow('already registered');
  });

  it('rejects a wrong password', async () => {
    await service.register({ email: 'a@b.co', password: 'password123' });
    await expect(service.login({ email: 'a@b.co', password: 'nope-nope' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh tokens and rejects the old one', async () => {
    const first = await service.register({ email: 'a@b.co', password: 'password123' });
    const second = await service.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.refresh(second.refreshToken)).resolves.toHaveProperty('accessToken');
  });

  it('rejects an access token used as a refresh token', async () => {
    const { accessToken } = await service.register({ email: 'a@b.co', password: 'password123' });
    await expect(service.refresh(accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
