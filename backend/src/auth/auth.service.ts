import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: {
    fullName: string;
    whatsapp: string;
    email: string;
    password: string;
  }) {
    const user = await this.usersService.createUser({
      fullName: payload.fullName,
      whatsapp: payload.whatsapp,
      email: payload.email,
      password: payload.password,
      role: UserRole.USER,
    });

    const tokenPack = await this.createSession(user.id, user.role, false);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        whatsapp: user.whatsapp,
        email: user.email,
        role: user.role,
        hasPin: Boolean(user.pinHash),
      },
      ...tokenPack,
    };
  }

  async login(payload: { identifier: string; password: string }) {
    const user = await this.usersService.findByEmailOrUsername(payload.identifier);

    if (!user) {
      throw new UnauthorizedException('Email/username atau password salah.');
    }

    await this.usersService.validatePassword(user, payload.password);

    const mustVerifyPin = this.mustVerifyPinOnLogin(user.role, Boolean(user.pinHash));
    const tokenPack = await this.createSession(
      user.id,
      user.role,
      !mustVerifyPin,
    );

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        whatsapp: user.whatsapp,
        email: user.email,
        role: user.role,
        hasPin: Boolean(user.pinHash),
      },
      ...tokenPack,
    };
  }

  async setupPin(userId: string, pin: string, confirmPin: string) {
    if (pin !== confirmPin) {
      throw new BadRequestException('Konfirmasi PIN tidak sesuai.');
    }

    const user = await this.usersService.ensureActiveUser(userId);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin tidak menggunakan PIN.');
    }

    await this.usersService.setupPin(user.id, pin);

    return this.rotateAfterPinVerified(user.id, user.role);
  }

  async verifyPin(userId: string, pin: string) {
    const user = await this.usersService.ensureActiveUser(userId);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin tidak menggunakan PIN.');
    }

    await this.usersService.verifyUserPin(user.id, pin);
    return this.rotateAfterPinVerified(user.id, user.role);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token tidak tersedia.');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: payload.sessionId },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Session tidak ditemukan.');
    }

    if (tokenRecord.userId !== payload.sub || tokenRecord.revokedAt) {
      throw new UnauthorizedException('Session tidak valid.');
    }

    const user = await this.usersService.ensureActiveUser(payload.sub);
    if (user.role !== payload.role) {
      throw new UnauthorizedException('Role session berubah.');
    }

    const shouldPinBeVerified =
      user.role === UserRole.ADMIN || Boolean(payload.pinVerified);

    const matches = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token tidak cocok.');
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token sudah expired.');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(user.id, user.role, shouldPinBeVerified);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return { success: true };
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      await this.prisma.refreshToken.updateMany({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  async me(userId: string) {
    return this.usersService.getProfile(userId);
  }

  private async rotateAfterPinVerified(userId: string, role: UserRole) {
    const tokenPack = await this.createSession(userId, role, true);
    return tokenPack;
  }

  private async createSession(userId: string, role: UserRole, pinVerified: boolean) {
    const sessionId = randomUUID();
    const accessToken = await this.jwtService.signAsync<JwtPayload>(
      {
        sub: userId,
        role,
        pinVerified,
        sessionId,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as never,
      },
    );

    const refreshToken = await this.jwtService.signAsync<JwtPayload>(
      {
        sub: userId,
        role,
        pinVerified,
        sessionId,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as never,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = this.resolveRefreshTokenExpiry(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    );

    await this.prisma.refreshToken.create({
      data: {
        id: sessionId,
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private resolveRefreshTokenExpiry(raw: string) {
    const normalized = raw.trim().toLowerCase();
    const matched = normalized.match(/^(\d+)([smhd])$/);

    if (!matched) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const value = Number(matched[1]);
    const unit = matched[2];

    const multiplierMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multiplierMap[unit]);
  }

  private mustVerifyPinOnLogin(role: UserRole, hasPin: boolean) {
    return role === UserRole.USER && hasPin;
  }
}
