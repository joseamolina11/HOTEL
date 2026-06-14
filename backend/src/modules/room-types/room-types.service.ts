import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType } from './entities/room-type.entity';
import { Room } from '../rooms/entities/room.entity';
import { Amenity } from '../amenities/entities/amenity.entity';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/create-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  async getAvailability(fechaEntrada: Date, fechaSalida: Date) {
    if (fechaEntrada >= fechaSalida) {
      throw new BadRequestException('La fecha de entrada debe ser anterior a la fecha de salida');
    }

    const occupiedRoomIds = await this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.reservations', 'reservation')
      .where('reservation.estado NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fecha_entrada < :fechaSalida', { fechaSalida })
      .andWhere('reservation.fecha_salida > :fechaEntrada', { fechaEntrada })
      .select('room.id')
      .getRawMany();

    const occupiedIds = new Set(occupiedRoomIds.map((r) => r.room_id));

    const roomTypes = await this.roomTypeRepository.find({ relations: ['rooms'] });

    return roomTypes.map((rt) => {
      const totalRooms = rt.rooms?.length || 0;
      const availableRooms = (rt.rooms || []).filter(
        (r) => r.estado !== 'mantenimiento' && !occupiedIds.has(r.id),
      ).length;
      return {
        id: rt.id,
        nombre: rt.nombre,
        totalRooms,
        availableRooms,
        precioBase: rt.precioBase,
        capacidadAdultos: rt.capacidadAdultos,
        capacidadNinos: rt.capacidadNinos,
        colorIdentificador: rt.colorIdentificador,
      };
    });
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.roomTypeRepository.findAndCount({
      relations: ['amenities'],
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<RoomType> {
    const roomType = await this.roomTypeRepository.findOne({
      where: { id },
      relations: ['amenities', 'rooms'],
    });
    if (!roomType) {
      throw new NotFoundException('Tipo de habitación no encontrado');
    }
    return roomType;
  }

  async create(createDto: CreateRoomTypeDto): Promise<RoomType> {
    const existing = await this.roomTypeRepository.findOne({
      where: { nombre: createDto.nombre },
    });
    if (existing) {
      throw new ConflictException('Ya existe un tipo de habitación con ese nombre');
    }

    const { amenityIds, ...data } = createDto;
    const roomType = this.roomTypeRepository.create(data);

    if (amenityIds?.length) {
      const amenities = await this.amenityRepository.findByIds(amenityIds);
      roomType.amenities = amenities;
    }

    return this.roomTypeRepository.save(roomType);
  }

  async update(id: string, updateDto: UpdateRoomTypeDto): Promise<RoomType> {
    const roomType = await this.findOne(id);
    const { amenityIds, ...data } = updateDto;

    Object.assign(roomType, data);

    if (amenityIds !== undefined) {
      const amenities = await this.amenityRepository.findByIds(amenityIds);
      roomType.amenities = amenities;
    }

    return this.roomTypeRepository.save(roomType);
  }

  async remove(id: string): Promise<void> {
    const roomType = await this.findOne(id);
    const hasRooms = await this.roomTypeRepository
      .createQueryBuilder('roomType')
      .relation('rooms')
      .of(roomType)
      .loadMany();

    if (hasRooms.length > 0) {
      throw new ConflictException('No se puede eliminar: el tipo de habitación tiene habitaciones asociadas');
    }

    await this.roomTypeRepository.remove(roomType);
  }
}
