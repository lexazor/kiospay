import { DepositStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateDepositStatusDto {
  @IsEnum(DepositStatus)
  status: DepositStatus;
}