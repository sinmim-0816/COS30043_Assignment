import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDesignDto } from './create-ticket-design.dto';

export class UpdateTicketDesignDto extends PartialType(CreateTicketDesignDto) {}
