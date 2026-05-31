import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTicketDesignDto {
  @Transform(({ value }) =>
    value === null || value === undefined ? value : String(value),
  )
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @IsString()
  @IsNotEmpty()
  design_image: string;

  @IsString()
  @IsOptional()
  description: string;
}
