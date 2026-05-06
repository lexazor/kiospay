import { IsOptional, IsString } from 'class-validator';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}