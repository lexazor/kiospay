import { UserStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ToggleUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}