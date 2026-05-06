import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class AdjustBalanceDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount: number;

  @IsString()
  @MinLength(3)
  note: string;

  @IsOptional()
  @IsString()
  userId?: string;
}