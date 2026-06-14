import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from './entities/amenity.entity';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/create-amenity.dto';

@Injectable()
export class AmenitiesService {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.amenityRepository.findAndCount({
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Amenity> {
    const amenity = await this.amenityRepository.findOne({ where: { id } });
    if (!amenity) {
      throw new NotFoundException('Amenidad no encontrada');
    }
    return amenity;
  }

  async create(createDto: CreateAmenityDto): Promise<Amenity> {
    const existing = await this.amenityRepository.findOne({
      where: { nombre: createDto.nombre },
    });
    if (existing) {
      throw new ConflictException('Ya existe una amenidad con ese nombre');
    }
    const amenity = this.amenityRepository.create(createDto);
    return this.amenityRepository.save(amenity);
  }

  async update(id: string, updateDto: UpdateAmenityDto): Promise<Amenity> {
    const amenity = await this.findOne(id);
    Object.assign(amenity, updateDto);
    return this.amenityRepository.save(amenity);
  }

  async remove(id: string): Promise<void> {
    const amenity = await this.findOne(id);
    await this.amenityRepository.remove(amenity);
  }
}
