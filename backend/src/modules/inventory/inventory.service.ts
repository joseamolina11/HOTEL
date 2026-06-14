import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateMovementDto } from './dto/create-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,
  ) {}

  async findAll(filters?: { categoria?: string; bajoStock?: boolean }, page = 1, limit = 10) {
    const query = this.inventoryItemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .orderBy('item.nombre', 'ASC');

    if (filters?.categoria) {
      query.andWhere('item.categoria = :categoria', { categoria: filters.categoria });
    }
    if (filters?.bajoStock) {
      query.andWhere('item.stockActual <= item.stockMinimo');
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLowStock() {
    return this.inventoryItemRepository.find({
      where: {
        stockActual: Raw((column) => `${column} <= stock_minimo`),
      },
      order: { nombre: 'ASC' },
    });
  }

  async findCategories(): Promise<string[]> {
    const result = await this.inventoryItemRepository
      .createQueryBuilder('item')
      .select('DISTINCT item.categoria', 'categoria')
      .orderBy('item.categoria', 'ASC')
      .getRawMany();
    return result.map((r) => r.categoria);
  }

  async findOne(id: string): Promise<InventoryItem> {
    const item = await this.inventoryItemRepository.findOne({
      where: { id },
      relations: ['movements', 'movements.user', 'category'],
    });
    if (!item) {
      throw new NotFoundException('Producto de inventario no encontrado');
    }
    return item;
  }

  async findMovements(id: string): Promise<InventoryMovement[]> {
    return this.inventoryMovementRepository.find({
      where: { inventoryItemId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllMovements(page = 1, limit = 10) {
    const [data, total] = await this.inventoryMovementRepository.findAndCount({
      relations: ['user', 'inventoryItem'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(createDto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.inventoryItemRepository.create(createDto);
    return this.inventoryItemRepository.save(item);
  }

  async update(id: string, updateDto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.inventoryItemRepository.save(item);
  }

  async createMovement(createMovementDto: CreateMovementDto, userId: string): Promise<InventoryMovement> {
    const item = await this.findOne(createMovementDto.inventoryItemId);
    const stockAnterior = item.stockActual;
    let stockPosterior: number;

    switch (createMovementDto.tipo) {
      case 'entrada':
        stockPosterior = stockAnterior + createMovementDto.cantidad;
        break;
      case 'salida':
        if (stockAnterior < createMovementDto.cantidad) {
          throw new BadRequestException('Stock insuficiente para realizar la salida');
        }
        stockPosterior = stockAnterior - createMovementDto.cantidad;
        break;
      case 'ajuste':
        stockPosterior = createMovementDto.cantidad;
        break;
      default:
        throw new BadRequestException('Tipo de movimiento inválido');
    }

    const movement = this.inventoryMovementRepository.create({
      inventoryItemId: createMovementDto.inventoryItemId,
      userId,
      tipo: createMovementDto.tipo,
      cantidad: createMovementDto.cantidad,
      stockAnterior,
      stockPosterior,
      precioUnitario: createMovementDto.precioUnitario ?? 0,
      observaciones: createMovementDto.observaciones,
    });
    await this.inventoryItemRepository.update(item.id, { stockActual: stockPosterior });
    return this.inventoryMovementRepository.save(movement);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.stockActual > 0) {
      throw new BadRequestException('No se puede eliminar un producto con stock actual mayor a 0');
    }
    await this.inventoryItemRepository.remove(item);
  }
}
