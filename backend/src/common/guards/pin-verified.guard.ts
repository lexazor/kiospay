import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PIN_REQUIRED_KEY } from '../decorators/pin-required.decorator';
import { RequestWithUser } from '../types/request-with-user.type';

@Injectable()
export class PinVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPin = this.reflector.getAllAndOverride<boolean>(PIN_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresPin) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const pinVerified = request.user?.pinVerified;

    if (!pinVerified) {
      throw new ForbiddenException('Verifikasi PIN diperlukan.');
    }

    return true;
  }
}