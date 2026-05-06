import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FieldType } from '@prisma/client';

export class ServiceInputFieldDto {
  @IsString()
  @MinLength(2)
  label: string;

  @IsEnum(FieldType)
  type: FieldType;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class CreateServiceDto {
  @IsString()
  categoryId: string;

  @IsString()
  @MaxLength(70)
  name: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  status: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceInputFieldDto)
  inputFields?: ServiceInputFieldDto[];
}