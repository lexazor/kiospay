import { IsOptional, IsString } from 'class-validator';

export class ListPaymentMethodQueryDto {
  @IsOptional()
  @IsString()
  scope?: 'public' | 'admin';
}