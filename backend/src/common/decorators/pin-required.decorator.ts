import { SetMetadata } from '@nestjs/common';

export const PIN_REQUIRED_KEY = 'pin_required';
export const PinRequired = () => SetMetadata(PIN_REQUIRED_KEY, true);