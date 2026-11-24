import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { env } from '../common/env';
import { User } from '../users/user.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Refresh tokens are long, high-entropy JWTs: bcrypt would truncate them at 72 bytes
// (the shared header+payload prefix), so they're stored as sha256 instead.
const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    if (await this.users.exists({ email: dto.email.toLowerCase() })) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.users.create({ email: dto.email, passwordHash: await bcrypt.hash(dto.password, 12) });
    return this.issueTokens(user.id as string, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.users.findOne({ email: dto.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id as string, user.email);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret: env('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user || user.refreshTokenHash !== sha256(refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueTokens(user.id as string, user.email);
  }

  /** Revokes the refresh token server-side. Invalid or already-rotated tokens are ignored. */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const payload = await this.jwt
      .verifyAsync<JwtPayload>(refreshToken, { secret: env('JWT_REFRESH_SECRET') })
      .catch(() => null);
    if (payload) {
      await this.users.updateOne({ _id: payload.sub, refreshTokenHash: sha256(refreshToken) }, { refreshTokenHash: null });
    }
  }

  // ponytail: one refresh token per user, so logging in on a second device signs out the first.
  // Move to a sessions collection if multi-device sessions matter.
  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: env('JWT_ACCESS_SECRET'), expiresIn: '15m' }),
      this.jwt.signAsync({ ...payload, jti: randomUUID() }, { secret: env('JWT_REFRESH_SECRET'), expiresIn: '7d' }),
    ]);
    await this.users.updateOne({ _id: userId }, { refreshTokenHash: sha256(refreshToken) });
    return { accessToken, refreshToken };
  }
}
