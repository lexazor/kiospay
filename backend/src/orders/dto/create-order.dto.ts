import { Transform } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDataItemDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class CreateOrderDto {
  @IsString()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerDataItemDto)
  customerData: CustomerDataItemDto[];

  @Transform(({ value }) => Number(value ?? 0))
  fee?: number;
}