import { IsOptional, IsString } from 'class-validator';

export class ListTransactionDto {
  @IsOptional()
  @IsString()
  type?: string;
}