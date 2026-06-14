import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Guest } from './entities/guest.entity';
import { CreateGuestDto, UpdateGuestDto } from './dto/create-guest.dto';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async findAll(search?: string, page = 1, limit = 10) {
    const where = search
      ? [
          { nombres: Like(`%${search}%`) },
          { apellidos: Like(`%${search}%`) },
          { documento: Like(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.guestRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: ['reservations', 'reservations.room', 'reservations.room.roomType'],
    });
    if (!guest) {
      throw new NotFoundException('Huésped no encontrado');
    }
    return guest;
  }

  async create(createDto: CreateGuestDto): Promise<Guest> {
    const existing = await this.guestRepository.findOne({
      where: { documento: createDto.documento },
    });
    if (existing) {
      throw new ConflictException('Ya existe un huésped con ese documento');
    }
    const guest = this.guestRepository.create(createDto);
    return this.guestRepository.save(guest);
  }

  async update(id: string, updateDto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.findOne(id);
    Object.assign(guest, updateDto);
    return this.guestRepository.save(guest);
  }

  async remove(id: string): Promise<void> {
    const guest = await this.findOne(id);
    if (guest.reservations?.length > 0) {
      throw new ConflictException('No se puede eliminar un huésped con reservas asociadas');
    }
    await this.guestRepository.remove(guest);
  }
}
