import { IsString, Matches } from 'class-validator';

export class ChangePinDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN lama harus 6 digit angka.' })
  oldPin: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN baru harus 6 digit angka.' })
  newPin: string;
}