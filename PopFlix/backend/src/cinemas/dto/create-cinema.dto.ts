import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OperatingHoursDto {
  @IsString()
  weekday: string;

  @IsString()
  weekend: string;

  @IsString()
  ph: string;
}

class AmenityDto {
  @IsString()
  icon: string;

  @IsString()
  label: string;
}

export class CreateCinemaDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  mall?: string;

  @IsNumber()
  @IsOptional()
  base_price?: number;

  @IsString()
  @IsOptional()
  location_address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  hall?: number;

  @IsString()
  @IsOptional()
  image_path?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operating_hours?: OperatingHoursDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AmenityDto)
  amenities?: AmenityDto[];
}
