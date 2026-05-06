import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  sortOrder: number;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status: boolean;

  @IsOptional()
  @IsIn(['BARU', 'PROMO', ''])
  badge?: string;
}