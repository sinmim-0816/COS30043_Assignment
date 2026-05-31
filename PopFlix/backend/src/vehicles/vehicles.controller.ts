import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(@Request() req, @Body() createVehicleDto: any) {
    return this.vehiclesService.create(req.user.userId, createVehicleDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.vehiclesService.findAllByUser(req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.deleteVehicle(id);
  }
}
