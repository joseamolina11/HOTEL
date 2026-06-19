import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../rooms/entities/room.entity';
import { SupplyItem } from '../supplies/entities/supply-item.entity';
import { SupplyMovement } from '../supplies/entities/supply-movement.entity';
import { HousekeepingSupply } from './entities/housekeeping-supply.entity';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(SupplyItem)
    private readonly supplyItemRepository: Repository<SupplyItem>,
    @InjectRepository(SupplyMovement)
    private readonly supplyMovementRepository: Repository<SupplyMovement>,
    @InjectRepository(HousekeepingSupply)
    private readonly hkSupplyRepository: Repository<HousekeepingSupply>,
  ) {}

  async findAll(tipo?: 'limpieza' | 'mantenimiento' | 'all') {
    const statuses: string[] = tipo === 'all' || !tipo
      ? ['limpieza', 'mantenimiento']
      : [tipo];

    const rooms = await this.roomRepository.find({
      where: statuses.map((estado) => ({ estado } as any)),
      relations: ['roomType'],
      order: { piso: 'ASC', numero: 'ASC' },
    });

    const roomIds = rooms.map((r) => r.id);
    if (roomIds.length > 0) {
      const supplies = await this.hkSupplyRepository.find({
        where: roomIds.map((id) => ({ roomId: id })),
        relations: ['supplyItem'],
      });
      (rooms as any).forEach((room: any) => {
        room.assignedSupplies = supplies.filter((s) => s.roomId === room.id);
      });
    } else {
      (rooms as any).forEach((room: any) => {
        room.assignedSupplies = [];
      });
    }

    return rooms;
  }

  async changeStatus(roomId: string, estado: Room['estado']) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }
    room.estado = estado;
    return this.roomRepository.save(room);
  }

  async assignSupplies(roomId: string, items: { supplyItemId: string; cantidad: number }[]) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }

    for (const item of items) {
      const supply = await this.supplyItemRepository.findOne({ where: { id: item.supplyItemId } });
      if (!supply) {
        throw new NotFoundException(`Insumo ${item.supplyItemId} no encontrado`);
      }
    }

    await this.hkSupplyRepository.delete({ roomId });

    const records = items.map((item) =>
      this.hkSupplyRepository.create({
        roomId,
        supplyItemId: item.supplyItemId,
        cantidad: item.cantidad,
      }),
    );

    return this.hkSupplyRepository.save(records);
  }

  async completeCleaning(roomId: string, userId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }

    const supplies = await this.hkSupplyRepository.find({
      where: { roomId },
      relations: ['supplyItem'],
    });

    if (supplies.length > 0) {
      for (const hs of supplies) {
        const item = hs.supplyItem;
        if (item.stockActual < hs.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente de ${item.nombre} para habitación ${room.numero}. Disponible: ${item.stockActual}, requerido: ${hs.cantidad}`,
          );
        }

        const stockAnterior = item.stockActual;
        const stockPosterior = stockAnterior - hs.cantidad;

        const movement = this.supplyMovementRepository.create({
          supplyItemId: hs.supplyItemId,
          userId,
          tipo: 'salida',
          cantidad: hs.cantidad,
          stockAnterior,
          stockPosterior,
          precioUnitario: Number(item.costoUnitario) || 0,
          observaciones: `Uso en limpieza - Habitación ${room.numero}`,
        });

        await this.supplyItemRepository.update(item.id, { stockActual: stockPosterior });
        await this.supplyMovementRepository.save(movement);
      }

      await this.hkSupplyRepository.delete({ roomId });
    }

    room.estado = 'disponible';
    return this.roomRepository.save(room);
  }

  async getAssignedSupplies(roomId: string) {
    return this.hkSupplyRepository.find({
      where: { roomId },
      relations: ['supplyItem'],
    });
  }
}
