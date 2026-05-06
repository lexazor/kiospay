import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetupPinDto } from './dto/setup-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ACCESS_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  LEGACY_REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../common/utils/cookie.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
    };
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      requiresPin: result.user.hasPin,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup-pin')
  async setupPin(
    @CurrentUser('sub') userId: string,
    @Body() body: SetupPinDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.setupPin(userId, body.pin, body.confirmPin);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-pin')
  async verifyPin(
    @CurrentUser('sub') userId: string,
    @Body() body: VerifyPinDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyPin(userId, body.pin);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { success: true };
  }

  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('sub') userId: string) {
    return this.authService.me(userId);
  }

  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    await this.authService.logout(refreshToken);
    this.clearAuthCookies(response);

    return { success: true };
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
    const cookieOptions = this.resolveCookieOptions();

    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(response: Response) {
    const cookieOptions = this.resolveCookieOptions();
    response.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
    response.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);

    // Cleanup legacy cookie names to prevent mixed-session behavior.
    response.clearCookie(LEGACY_ACCESS_TOKEN_COOKIE, cookieOptions);
    response.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, cookieOptions);
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(LEGACY_ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private resolveCookieOptions(): CookieOptions {
    return {
      domain: this.resolveCookieDomain(),
      path: '/',
      sameSite: 'lax',
      secure:
        process.env.NODE_ENV === 'production' ||
        (process.env.CORS_ORIGIN ?? '').startsWith('https://'),
    };
  }

  private resolveCookieDomain() {
    const raw = process.env.COOKIE_DOMAIN?.trim();
    if (!raw) {
      return undefined;
    }

    // Accept either "example.com" or "https://example.com" and normalize to host only.
    return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}
