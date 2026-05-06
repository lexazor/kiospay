import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  serviceId: string;

  @IsString()
  @MaxLength(70)
  name: string;

  @IsOptional()
  @IsString()
  tabType?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  nominal: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? null : Number(value),
  )
  @IsNumber()
  stock?: number | null;
}

export class BulkToggleProductsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status: boolean;
}