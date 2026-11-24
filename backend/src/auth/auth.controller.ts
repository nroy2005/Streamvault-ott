import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const REFRESH_COOKIE = 'refresh_token';

// httpOnly: page JavaScript (and so XSS) can't read it.
// sameSite=strict: never sent on cross-site requests, which blocks CSRF on /refresh and /logout.
// path: only sent to the auth routes (global prefix is /api), not on every API call.
const cookieBase: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
};
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // matches the refresh JWT's 7d expiry

export interface AccessTokenResponse {
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<AccessTokenResponse> {
    return withRefreshCookie(res, await this.auth.register(dto));
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<AccessTokenResponse> {
    return withRefreshCookie(res, await this.auth.login(dto));
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AccessTokenResponse> {
    return withRefreshCookie(res, await this.auth.refresh(readRefreshCookie(req)));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(readRefreshCookie(req));
    res.clearCookie(REFRESH_COOKIE, cookieBase);
  }
}

function withRefreshCookie(res: Response, { accessToken, refreshToken }: AuthTokens): AccessTokenResponse {
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: REFRESH_TTL_MS });
  return { accessToken }; // the refresh token never appears in a response body
}

function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = (req.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === 'string' ? value : undefined;
}
