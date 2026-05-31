import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(userId: number, createVehicleDto: any) {
    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      user: { id: userId },
    });
    return this.vehicleRepository.save(vehicle);
  }

  async findAllByUser(userId: number) {
    return this.vehicleRepository.find({ where: { user: { id: userId } } });
  }

  async deleteVehicle(id: number): Promise<{ success: boolean }> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    await this.vehicleRepository.remove(vehicle);
    return { success: true };
  }
}
