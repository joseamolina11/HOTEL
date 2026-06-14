import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotelConfig } from './entities/hotel-config.entity';
import { CreateHotelConfigDto, UpdateHotelConfigDto } from './dto/hotel-config.dto';

@Injectable()
export class HotelConfigService {
  constructor(
    @InjectRepository(HotelConfig)
    private readonly hotelConfigRepository: Repository<HotelConfig>,
  ) {}

  async getConfig(): Promise<HotelConfig> {
    const config = await this.hotelConfigRepository.findOne({ where: {} });
    if (!config) {
      throw new NotFoundException('Configuración del hotel no encontrada');
    }
    return config;
  }

  async createConfig(createDto: CreateHotelConfigDto): Promise<HotelConfig> {
    const existing = await this.hotelConfigRepository.findOne({ where: {} });
    if (existing) {
      return this.updateConfig(createDto);
    }
    const config = this.hotelConfigRepository.create(createDto);
    return this.hotelConfigRepository.save(config);
  }

  async updateConfig(updateDto: UpdateHotelConfigDto): Promise<HotelConfig> {
    const config = await this.hotelConfigRepository.findOne({ where: {} });
    if (!config) {
      this.hotelConfigRepository.create(updateDto);
      return this.hotelConfigRepository.save(updateDto);
    }
    Object.assign(config, updateDto);
    return this.hotelConfigRepository.save(config);
  }
}
