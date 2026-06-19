import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { SupplyItem } from './entities/supply-item.entity';
import { SupplyMovement } from './entities/supply-movement.entity';
import { CreateSupplyItemDto, UpdateSupplyItemDto, CreateSupplyMovementDto } from './dto/create-supply-item.dto';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(SupplyItem)
    private readonly supplyItemRepository: Repository<SupplyItem>,
    @InjectRepository(SupplyMovement)
    private readonly supplyMovementRepository: Repository<SupplyMovement>,
  ) {}

  async findAll(filters?: { categoria?: string; bajoStock?: boolean }, page = 1, limit = 10) {
    const query = this.supplyItemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .orderBy('item.nombre', 'ASC');

    if (filters?.categoria) {
      query.andWhere('item.categoriaSuministro = :categoria', { categoria: filters.categoria });
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
    return this.supplyItemRepository.find({
      where: {
        stockActual: Raw((column) => `${column} <= stock_minimo`),
      },
      order: { nombre: 'ASC' },
    });
  }

  async findCategories(): Promise<string[]> {
    const result = await this.supplyItemRepository
      .createQueryBuilder('item')
      .select('DISTINCT item.categoriaSuministro', 'categoria')
      .orderBy('item.categoriaSuministro', 'ASC')
      .getRawMany();
    return result.map((r) => r.categoria);
  }

  async findOne(id: string): Promise<SupplyItem> {
    const item = await this.supplyItemRepository.findOne({
      where: { id },
      relations: ['movements', 'movements.user', 'category'],
    });
    if (!item) {
      throw new NotFoundException('Insumo no encontrado');
    }
    return item;
  }

  async findMovements(id: string): Promise<SupplyMovement[]> {
    return this.supplyMovementRepository.find({
      where: { supplyItemId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllMovements(page = 1, limit = 10) {
    const [data, total] = await this.supplyMovementRepository.findAndCount({
      relations: ['user', 'supplyItem'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(createDto: CreateSupplyItemDto): Promise<SupplyItem> {
    const item = this.supplyItemRepository.create(createDto);
    return this.supplyItemRepository.save(item);
  }

  async update(id: string, updateDto: UpdateSupplyItemDto): Promise<SupplyItem> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.supplyItemRepository.save(item);
  }

  async createMovement(createMovementDto: CreateSupplyMovementDto, userId: string): Promise<SupplyMovement> {
    const item = await this.findOne(createMovementDto.supplyItemId);
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

    const movement = this.supplyMovementRepository.create({
      supplyItemId: createMovementDto.supplyItemId,
      userId,
      tipo: createMovementDto.tipo,
      cantidad: createMovementDto.cantidad,
      stockAnterior,
      stockPosterior,
      precioUnitario: createMovementDto.precioUnitario ?? 0,
      observaciones: createMovementDto.observaciones,
      expenseId: createMovementDto.expenseId || undefined,
    });
    await this.supplyItemRepository.update(item.id, { stockActual: stockPosterior });
    return this.supplyMovementRepository.save(movement);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.stockActual > 0) {
      throw new BadRequestException('No se puede eliminar un insumo con stock actual mayor a 0');
    }
    await this.supplyItemRepository.remove(item);
  }
}
