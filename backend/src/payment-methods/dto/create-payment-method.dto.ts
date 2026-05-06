import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @MaxLength(40)
  name: string;

  @IsString()
  @MaxLength(60)
  accountNumber: string;

  @IsString()
  @MaxLength(60)
  accountName: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  uniqueCodeEnabled: boolean;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  minDeposit: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  maxDeposit: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  expiryMinutes: number;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status: boolean;
}