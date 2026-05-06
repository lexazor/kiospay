import { IsOptional, IsString } from 'class-validator';

export class ListServicesQueryDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;
}