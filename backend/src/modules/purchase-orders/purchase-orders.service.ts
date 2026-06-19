import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, UpdateOrderStatusDto } from './dto/create-purchase-order.dto';
import { TaxConfig } from '../tax-config/entities/tax-config.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly repo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly itemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(TaxConfig)
    private readonly taxConfigRepo: Repository<TaxConfig>,
  ) {}

  async findAll(filters?: { search?: string; estado?: string; supplierId?: string; desde?: string; hasta?: string }, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.items', 'items')
      .orderBy('po.createdAt', 'DESC');

    if (filters?.search) query.andWhere('po.codigo ILIKE :search', { search: `%${filters.search}%` });
    if (filters?.estado) query.andWhere('po.estado = :estado', { estado: filters.estado });
    if (filters?.supplierId) query.andWhere('po.supplierId = :supplierId', { supplierId: filters.supplierId });
    if (filters?.desde) query.andWhere('po.fecha >= :desde', { desde: filters.desde });
    if (filters?.hasta) query.andWhere('po.fecha <= :hasta', { hasta: filters.hasta });

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const po = await this.repo.findOne({
      where: { id },
      relations: ['supplier', 'items'],
    });
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    return po;
  }

  async findByCode(codigo: string): Promise<PurchaseOrder> {
    const po = await this.repo.findOne({
      where: { codigo },
      relations: ['supplier', 'items'],
    });
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    return po;
  }

  private async generateCodigo(): Promise<string> {
    const now = new Date();

    const prefix = `OC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;

    const last = await this.itemRepo.manager.connection
      .getRepository(PurchaseOrder)
      .createQueryBuilder('oc')
      // .setLock('pessimistic_write')
      .where('oc.codigo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('oc.codigo', 'DESC')
      .getOne();

    const lastNum = last
      ? parseInt(last.codigo.split('-').pop() ?? '0', 10)
      : 0;

    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  async create(dto: CreatePurchaseOrderDto, userId: string): Promise<PurchaseOrder> {
    const codigo = await this.generateCodigo();
    let subtotal = 0;
    const items = dto.items.map((item) => {
      const sub = item.cantidad * item.precioUnitario;
      subtotal += sub;
      return this.itemRepo.create({
        inventoryItemId: item.inventoryItemId,
        serviceId: item.serviceId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: sub,
      });
    });

    let tasaImpuesto = 19;
    if (dto.taxConfigId) {
      const taxConfig = await this.taxConfigRepo.findOne({ where: { id: dto.taxConfigId } });
      if (taxConfig) tasaImpuesto = Number(taxConfig.tasa);
    } else {
      const defaultTax = await this.taxConfigRepo.findOne({ where: { activo: true, esDefecto: true } });
      if (defaultTax) tasaImpuesto = Number(defaultTax.tasa);
    }

    const impuestos = subtotal * (tasaImpuesto / 100);
    const total = subtotal + impuestos;

    const po = this.repo.create({
      codigo,
      supplierId: dto.supplierId,
      fecha: dto.fecha,
      observaciones: dto.observaciones,
      estado: dto.estado || 'borrador',
      subtotal,
      impuestos,
      total,
      tasaImpuesto,
      taxConfigId: dto.taxConfigId || undefined,
      createdBy: userId,
      items,
    });

    return this.repo.save(po);
  }

  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    if (po.estado !== 'borrador') {
      throw new BadRequestException('Solo se pueden modificar órdenes en estado borrador');
    }

    if (dto.items) {
      await this.itemRepo.delete({ purchaseOrderId: id });
      let subtotal = 0;
      const items = dto.items.map((item) => {
        const sub = item.cantidad * item.precioUnitario;
        subtotal += sub;
        return this.itemRepo.create({
          purchaseOrderId: id,
          inventoryItemId: item.inventoryItemId,
          serviceId: item.serviceId,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: sub,
        });
      });
      po.items = items;
      po.subtotal = subtotal;

      let tasaImpuesto = Number(po.tasaImpuesto) || 19;
      if (dto.taxConfigId) {
        const taxConfig = await this.taxConfigRepo.findOne({ where: { id: dto.taxConfigId } });
        if (taxConfig) tasaImpuesto = Number(taxConfig.tasa);
      } else {
        const defaultTax = await this.taxConfigRepo.findOne({ where: { activo: true, esDefecto: true } });
        if (defaultTax) tasaImpuesto = Number(defaultTax.tasa);
      }

      po.impuestos = subtotal * (tasaImpuesto / 100);
      po.total = subtotal + po.impuestos;
      po.tasaImpuesto = tasaImpuesto;
      if (dto.taxConfigId) po.taxConfigId = dto.taxConfigId;
    }

    Object.assign(po, dto);
    return this.repo.save(po);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    po.estado = dto.estado;
    return this.repo.save(po);
  }

  async remove(id: string): Promise<void> {
    const po = await this.findOne(id);
    if (po.estado !== 'borrador') {
      throw new BadRequestException('Solo se pueden eliminar órdenes en estado borrador');
    }
    await this.itemRepo.delete({ purchaseOrderId: id });
    await this.repo.delete(id);
  }
}
