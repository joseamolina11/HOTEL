import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere, In, Not } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationGuest } from './entities/reservation-guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Guest } from '../guests/entities/guest.entity';
import { RoomType } from '../room-types/entities/room-type.entity';
import { CreateReservationDto, UpdateReservationDto, CancelReservationDto, ReservationFilterDto, ChangeRoomDto, AddAbonoDto } from './dto/create-reservation.dto';
import { getMaxSequence, sequentialCode } from 'src/common/utils/generate-code';
import { parseLocalDate } from 'src/common/utils/date';
import { isDateOverlap } from 'src/common/utils/date-utils';
import { Payment } from '../payments/entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { ReciboCajaService } from '../recibo-caja/recibo-caja.service';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationGuest)
    private readonly reservationGuestRepository: Repository<ReservationGuest>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly reciboCajaService: ReciboCajaService,
    private readonly financialMovementsService: FinancialMovementsService,
  ) {}

  async generateNextReservationCode(): Promise<string> {
    const last = await getMaxSequence(this.reservationRepository, 'codigo', 'RES');
    return sequentialCode(last + 1, 'RES');
  }

  async generateNextCheckinCode(): Promise<string> {
    const last = await getMaxSequence(this.reservationRepository, 'checkin_consecutivo', 'CHK');
    return sequentialCode(last + 1, 'CHK');
  }

  async findAll(filters: ReservationFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.reservationRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.contratoFile', 'contratoFile')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('reservation.payments', 'payments')
      .leftJoinAndSelect('payments.metodoPago', 'metodoPago')
      .leftJoinAndSelect('metodoPago.financialAccount', 'financialAccount')
      .leftJoinAndSelect('reservation.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .skip(skip)
      .take(limit)
      .orderBy('reservation.fechaEntrada', 'DESC');

    if (filters.estado) {
      query.andWhere('reservation.estado = :estado', { estado: filters.estado });
    }
    if (filters.fechaEntrada) {
      query.andWhere('reservation.fechaEntrada >= :fechaEntrada', { fechaEntrada: new Date(filters.fechaEntrada) });
    }
    if (filters.fechaSalida) {
      query.andWhere('reservation.fechaSalida <= :fechaSalida', { fechaSalida: new Date(filters.fechaSalida) });
    }
    if (filters.search) {
      query.andWhere(
        '(guest.nombres LIKE :search OR guest.apellidos LIKE :search OR guest.documento LIKE :search OR reservation.codigo LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    const ids = data.map((r) => r.id);
    let pendingOrders: Order[] = [];
    if (ids.length > 0) {
      pendingOrders = await this.orderRepository.find({
        where: [
          { reservationId: In(ids), estado: 'borrador' },
          { reservationId: In(ids), estado: 'pendiente' },
        ],
      });
    }
    const pendingByReservation = new Map<string, number>();
    for (const o of pendingOrders) {
      pendingByReservation.set(o.reservationId, (pendingByReservation.get(o.reservationId) || 0) + Number(o.total));
    }

    return {
      data: data.map((r) => this.withBalance(r, pendingByReservation.get(r.id) || 0)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private withBalance(reservation: Reservation, totalPedidos = 0) {
    const noches = Math.max(0, Math.ceil(
      (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaEntrada).getTime()) /
        (1000 * 60 * 60 * 24),
    ));
    const precioNoche = Number(reservation.precioBase ?? reservation.room?.roomType?.precioBase ?? 0);
    const totalHabitacion = noches * precioNoche;
    const totalRecargos = (reservation.surcharges || []).reduce((sum, s) => sum + Number(s.subtotal), 0);
    const totalEstancia = totalHabitacion + totalRecargos;
    const totalPagado = (reservation.payments || []).reduce((sum, p) => sum + Number(p.monto), 0);
    const descuento = Number(reservation.descuento || 0);
    const saldoPendiente = Math.max(0, totalEstancia + totalPedidos - descuento - totalPagado);
    return {
      ...reservation,
      resumen: {
        noches,
        precioPorNoche: precioNoche,
        totalHabitacion,
        totalRecargos,
        totalPedidos,
        totalEstancia,
        totalPagado,
        saldoPendiente,
      },
    };
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: [
        'room', 'room.roomType', 'room.roomType.amenities',
        'guest', 'companions',
        'checkIn', 'checkIn.user',
        'checkOut', 'checkOut.user',
        'consumptions', 'consumptions.inventoryItem',
        'orders', 'orders.items', 'orders.items.inventoryItem',
        'payments', 'payments.metodoPago',
        'surcharges', 'surcharges.surchargeType',
        'recibosCaja', 'recibosCaja.items',
        'contratoFile',
      ],
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    if (reservation.surcharges) {
      reservation.surcharges = reservation.surcharges.filter((s) => !s.deletedAt);
    }
    return reservation;
  }

  async updateContract(id: string, contratoFileId: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.estado === 'cancelada') {
      throw new BadRequestException('No se puede modificar una reserva cancelada');
    }
    reservation.contratoFileId = contratoFileId;
    return this.reservationRepository.save(reservation);
  }

  async findByCode(codigo: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { codigo },
      relations: ['room', 'room.roomType', 'guest', 'companions', 'contratoFile'],
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return reservation;
  }

  async findToday() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const arrivals = await this.reservationRepository.find({
      where: {
        fechaEntrada: Between(startOfDay, endOfDay),
        estado: 'confirmada',
      },
      relations: ['room', 'room.roomType', 'guest', 'payments'],
    });

    const departures = await this.reservationRepository.find({
      where: {
        fechaSalida: Between(startOfDay, endOfDay),
        estado: 'checkin',
      },
      relations: ['room', 'room.roomType', 'guest', 'payments'],
    });

    return { arrivals, departures };
  }

  async create(createDto: CreateReservationDto, userId: string): Promise<Reservation> {
    const room = await this.roomRepository.findOne({
      where: { id: createDto.roomId },
      relations: ['roomType'],
    });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }

    if (room.estado === 'mantenimiento') {
      throw new ConflictException('La habitación está en mantenimiento');
    }

    const guest = await this.guestRepository.findOne({
      where: { id: createDto.guestId },
    });
    if (!guest) {
      throw new NotFoundException('Huésped no encontrado');
    }

    const fechaEntrada = parseLocalDate(createDto.fechaEntrada);
    const fechaSalida = parseLocalDate(createDto.fechaSalida);

    if (fechaEntrada >= fechaSalida) {
      throw new BadRequestException('La fecha de entrada debe ser anterior a la fecha de salida');
    }

    const capacidadTotal = room.roomType.capacidadAdultos + room.roomType.capacidadNinos;
    if (createDto.cantidadHuespedes > capacidadTotal) {
      throw new BadRequestException(
        `La habitación tiene capacidad máxima de ${capacidadTotal} personas`,
      );
    }

    const overlapping = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId: createDto.roomId })
      .andWhere('reservation.estado NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fechaEntrada < :fechaSalida', { fechaSalida })
      .andWhere('reservation.fechaSalida > :fechaEntrada', { fechaEntrada })
      .getCount();

    if (overlapping > 0) {
      throw new ConflictException('La habitación ya está reservada en esas fechas');
    }

    const codigo = await this.generateNextReservationCode();

    const reservation = this.reservationRepository.create({
      codigo,
      roomId: createDto.roomId,
      guestId: createDto.guestId,
      fechaEntrada,
      fechaSalida,
      cantidadHuespedes: createDto.cantidadHuespedes,
      observaciones: createDto.observaciones,
      estado: createDto.estado || 'pendiente',
      origen: 'directo',
      createdById: userId,
      precioBase: room.roomType?.precioBase ? Number(room.roomType.precioBase) : undefined,
      descuento: createDto.descuento || 0,
    });

    if (createDto.companions?.length) {
      const companionRecords = [];
      for (const c of createDto.companions) {
        let guest = await this.guestRepository.findOne({ where: { documento: c.documento } });
        if (!guest) {
          guest = this.guestRepository.create({
            nombres: c.nombres,
            apellidos: c.apellidos,
            documento: c.documento,
            tipoIdentificacion: c.tipoIdentificacion || 'CC',
            nacionalidad: c.nacionalidad,
            telefono: c.telefono || '',
            email: c.email || '',
          });
          guest = await this.guestRepository.save(guest);
        }
        companionRecords.push(this.reservationGuestRepository.create({
          nombres: c.nombres,
          apellidos: c.apellidos,
          documento: c.documento,
          tipoIdentificacion: c.tipoIdentificacion || 'CC',
          nacionalidad: c.nacionalidad,
          telefono: c.telefono,
          email: c.email,
        }));
      }
      reservation.companions = companionRecords;
    }

    const saved = await this.reservationRepository.save(reservation);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (saved.estado === 'confirmada' && fechaEntrada.getTime() <= hoy.getTime()) {
      await this.roomRepository.update(createDto.roomId, { estado: 'reservada' });
    }

    if (createDto.pagoMonto && createDto.pagoMonto > 0 && createDto.pagoMetodoPagoId) {
      await this.registerPayment(
        saved,
        {
          monto: createDto.pagoMonto,
          metodoPagoId: createDto.pagoMetodoPagoId,
          comprobante: createDto.pagoReferencia,
          concepto: 'Anticipo',
        },
        userId,
        `${guest.nombres} ${guest.apellidos}`,
      );
    }

    return this.findOne(saved.id);
  }

  private async registerPayment(
    reservation: Reservation,
    paymentData: { monto: number; metodoPagoId: string; comprobante?: string; concepto: string },
    userId: string,
    clienteNombre: string,
  ) {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: { estado: 'abierta' },
    });

    const pm = await this.paymentMethodsService.findOne(paymentData.metodoPagoId);

    const payment = this.paymentRepository.create({
      roomId: reservation.roomId,
      reservationId: reservation.id,
      userId,
      monto: paymentData.monto,
      metodoPagoId: paymentData.metodoPagoId,
      comprobante: paymentData.comprobante || '',
      observaciones: `${paymentData.concepto} ${reservation.codigo} - ${pm.nombre}`,
      fecha: new Date(),
    });
    const savedPayment = await this.paymentRepository.save(payment);

    const tipo = pm.tipo || 'otros';
    if (cashRegister) {
      cashRegister.totalVentas = Number(cashRegister.totalVentas) + paymentData.monto;
      if (tipo === 'efectivo') cashRegister.totalEfectivo = Number(cashRegister.totalEfectivo) + paymentData.monto;
      else if (tipo === 'transferencia') cashRegister.totalTransferencia = Number(cashRegister.totalTransferencia) + paymentData.monto;
      else if (tipo === 'tarjeta') cashRegister.totalTarjeta = Number(cashRegister.totalTarjeta) + paymentData.monto;
      else cashRegister.totalOtros = Number(cashRegister.totalOtros) + paymentData.monto;
      cashRegister.cantidadTransacciones += 1;
      await this.cashRegisterRepository.save(cashRegister);
    }

    const recibo = await this.reciboCajaService.create({
      clienteNombre,
      reservationId: reservation.id,
      fecha: new Date().toISOString().slice(0, 10),
      subtotal: paymentData.monto,
      descuento: 0,
      total: paymentData.monto,
      pagos: [{
        concepto: `${paymentData.concepto} ${reservation.codigo}`,
        monto: paymentData.monto,
        metodoPagoId: paymentData.metodoPagoId,
        cuentaId: pm.financialAccountId || '',
        referenciaTipo: 'payment',
        referenciaId: savedPayment.id,
      }],
      items: [],
    }, userId);

    if (pm.financialAccountId) {
      try {
        await this.financialMovementsService.create({
          accountId: pm.financialAccountId,
          tipo: 'INGRESO',
          monto: paymentData.monto,
          concepto: `${paymentData.concepto} ${reservation.codigo} - ${pm.nombre}`,
          referenciaTipo: 'payment',
          referenciaId: savedPayment.id,
          reciboId: recibo.id,
          cashRegisterId: cashRegister?.id,
        }, userId);
      } catch {
        // skip
      }
    }

    return savedPayment;
  }

  async update(id: string, updateDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (!['pendiente', 'confirmada'].includes(reservation.estado)) {
      throw new BadRequestException('No se puede modificar una reserva en este estado');
    }

    if (reservation.origen !== 'directo') {
      throw new BadRequestException('No se puede modificar una reserva de OTA');
    }

    if (updateDto.roomId) {
      const room = await this.roomRepository.findOne({
        where: { id: updateDto.roomId },
        relations: ['roomType'],
      });
      if (!room) throw new NotFoundException('Habitación no encontrada');
    }

    const fechaEntrada = updateDto.fechaEntrada ? parseLocalDate(updateDto.fechaEntrada) : reservation.fechaEntrada;
    const fechaSalida = updateDto.fechaSalida ? parseLocalDate(updateDto.fechaSalida) : reservation.fechaSalida;
    const roomId = updateDto.roomId || reservation.roomId;

    if (fechaEntrada >= fechaSalida) {
      throw new BadRequestException('La fecha de entrada debe ser anterior a la fecha de salida');
    }

    const overlapping = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.id != :id', { id })
      .andWhere('reservation.estado NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fechaEntrada < :fechaSalida', { fechaSalida })
      .andWhere('reservation.fechaSalida > :fechaEntrada', { fechaEntrada })
      .getCount();

    if (overlapping > 0) {
      throw new ConflictException('La habitación ya está reservada en esas fechas');
    }

    Object.assign(reservation, updateDto);
    if (updateDto.fechaEntrada) reservation.fechaEntrada = fechaEntrada;
    if (updateDto.fechaSalida) reservation.fechaSalida = fechaSalida;

    return this.reservationRepository.save(reservation);
  }

  async changeRoom(id: string, newRoomId: string, userId?: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['room', 'room.roomType', 'guest'],
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    if (!['pendiente', 'confirmada', 'checkin'].includes(reservation.estado)) {
      throw new BadRequestException('No se puede cambiar la habitación en el estado actual');
    }

    const newRoom = await this.roomRepository.findOne({
      where: { id: newRoomId },
      relations: ['roomType'],
    });
    if (!newRoom) throw new NotFoundException('Habitación no encontrada');
    if (newRoom.estado === 'mantenimiento') {
      throw new BadRequestException('La habitación de destino está en mantenimiento');
    }

    if (reservation.estado === 'checkin') {
      if (newRoom.estado !== 'disponible') {
        throw new BadRequestException('La habitación de destino no está disponible');
      }
    } else {
      const overlapping = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.roomId = :roomId', { roomId: newRoomId })
        .andWhere('reservation.id != :id', { id })
        .andWhere('reservation.estado NOT IN (:...excludedStatuses)', {
          excludedStatuses: ['cancelada', 'checkout'],
        })
        .andWhere('reservation.fechaEntrada < :fechaSalida', { fechaSalida: reservation.fechaSalida })
        .andWhere('reservation.fechaSalida > :fechaEntrada', { fechaEntrada: reservation.fechaEntrada })
        .getCount();
      if (overlapping > 0) {
        throw new ConflictException('La habitación de destino no está disponible en esas fechas');
      }
    }

    const oldRoomId = reservation.roomId;
    await this.reservationRepository.update(id, { roomId: newRoomId });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (reservation.estado === 'checkin') {
      await this.roomRepository.update(oldRoomId, { estado: 'disponible' });
      await this.roomRepository.update(newRoomId, { estado: 'ocupada' });
    } else {
      const otherActive = await this.reservationRepository.count({
        where: {
          roomId: oldRoomId,
          id: Not(id),
          estado: In(['confirmada', 'checkin']),
        },
      });
      if (!otherActive) {
        await this.roomRepository.update(oldRoomId, { estado: 'disponible' });
      }
      if (reservation.fechaEntrada.getTime() <= hoy.getTime()) {
        await this.roomRepository.update(newRoomId, { estado: 'reservada' });
      }
    }

    const updated = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('roomType.amenities', 'amenities')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.companions', 'companions')
      .leftJoinAndSelect('reservation.checkIn', 'checkIn')
      .leftJoinAndSelect('checkIn.user', 'checkInUser')
      .leftJoinAndSelect('reservation.checkOut', 'checkOut')
      .leftJoinAndSelect('checkOut.user', 'checkOutUser')
      .leftJoinAndSelect('reservation.consumptions', 'consumptions')
      .leftJoinAndSelect('consumptions.inventoryItem', 'consumptionItem')
      .leftJoinAndSelect('reservation.orders', 'orders')
      .leftJoinAndSelect('orders.items', 'orderItems')
      .leftJoinAndSelect('orderItems.inventoryItem', 'orderItem')
      .leftJoinAndSelect('reservation.payments', 'payments')
      .leftJoinAndSelect('payments.metodoPago', 'metodoPago')
      .leftJoinAndSelect('reservation.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .leftJoinAndSelect('surcharges.surchargeType', 'surchargeType')
      .leftJoinAndSelect('reservation.recibosCaja', 'recibosCaja')
      .leftJoinAndSelect('recibosCaja.items', 'reciboItems')
      .leftJoinAndSelect('reservation.contratoFile', 'contratoFile')
      .where('reservation.id = :id', { id })
      .getOne();
    if (!updated) throw new NotFoundException('Reserva no encontrada después del cambio');
    return updated;
  }

  async cancel(id: string, cancelDto?: CancelReservationDto, userId?: string): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (['checkin', 'checkout', 'cancelada'].includes(reservation.estado)) {
      throw new BadRequestException('No se puede cancelar una reserva en este estado');
    }

    reservation.estado = 'cancelada';
    if (cancelDto?.motivo) {
      reservation.observaciones = cancelDto.motivo;
    }

    const saved = await this.reservationRepository.save(reservation);

    await this.roomRepository.update(reservation.roomId, { estado: 'disponible' });

    if (cancelDto?.reembolsoMonto && cancelDto?.reembolsoMonto > 0 && cancelDto?.reembolsoMetodoPagoId) {
      try {
        const pm = await this.paymentMethodsService.findOne(cancelDto.reembolsoMetodoPagoId);
        const payment = this.paymentRepository.create({
          reservationId: reservation.id,
          userId: userId,
          monto: cancelDto.reembolsoMonto,
          metodoPagoId: cancelDto.reembolsoMetodoPagoId,
          comprobante: '',
          observaciones: `Reembolso por cancelación ${reservation.codigo} - ${pm.nombre}`,
          fecha: new Date(),
        } as any);
        const savedPayment = await this.paymentRepository.save(payment as any);

        if (pm.financialAccountId) {
          await this.financialMovementsService.create({
            accountId: pm.financialAccountId,
            tipo: 'EGRESO',
            monto: cancelDto.reembolsoMonto,
            concepto: `Reembolso cancelación ${reservation.codigo} - ${pm.nombre}`,
            referenciaTipo: 'payment',
            referenciaId: savedPayment.id,
            cashRegisterId: undefined,
          }, userId);
        }
      } catch (e: any) {
        // skip if refund fails, reservation is already cancelled
      }
    }

    return saved;
  }

  async confirm(id: string): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (reservation.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden confirmar reservas pendientes');
    }

    reservation.estado = 'confirmada';
    const saved = await this.reservationRepository.save(reservation);

    await this.roomRepository.update(reservation.roomId, { estado: 'reservada' });

    return saved;
  }

  async addAbono(id: string, dto: AddAbonoDto, userId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['guest', 'room', 'room.roomType', 'payments'],
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    if (['cancelada', 'checkout'].includes(reservation.estado)) {
      throw new BadRequestException('No se pueden registrar abonos en una reserva cancelada o finalizada');
    }

    await this.registerPayment(
      reservation,
      {
        monto: dto.monto,
        metodoPagoId: dto.metodoPagoId,
        comprobante: dto.comprobante,
        concepto: dto.observaciones || 'Abono',
      },
      userId,
      `${reservation.guest?.nombres || ''} ${reservation.guest?.apellidos || ''}`.trim(),
    );

    const updated = await this.findOne(id);
    return this.withBalance(updated);
  }
}
