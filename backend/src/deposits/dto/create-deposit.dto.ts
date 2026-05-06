import { Transform } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateDepositDto {
  @IsString()
  paymentMethodId: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  amount: number;
}