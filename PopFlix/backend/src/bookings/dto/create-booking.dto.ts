import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @Type(() => Number)
  @IsNumber()
  showtimeId: number;

  @IsArray()
  @IsString({ each: true })
  seats: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  seatPrice: number;

  @IsOptional()
  @IsBoolean()
  usePoints?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsToUse?: number;

  @IsOptional()
  @IsString()
  parkingSpot?: string;
}
