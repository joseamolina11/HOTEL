import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckIn } from './entities/check-in.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationGuest } from '../reservations/entities/reservation-guest.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { HotelConfig } from '../hotel-config/entities/hotel-config.entity';
import { CheckInDto } from './dto/check-in.dto';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { ReciboCajaService } from '../recibo-caja/recibo-caja.service';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationGuest)
    private readonly reservationGuestRepository: Repository<ReservationGuest>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(HotelConfig)
    private readonly hotelConfigRepository: Repository<HotelConfig>,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly reciboCajaService: ReciboCajaService,
    private readonly financialMovementsService: FinancialMovementsService,
  ) {}

  async findPendingCheckIns() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.reservationRepository.find({
      where: {
        fechaEntrada: Between(startOfDay, endOfDay),
        estado: 'confirmada',
      },
      relations: ['room', 'room.roomType', 'guest', 'companions'],
      order: { fechaEntrada: 'ASC' },
    });
  }

  async checkIn(checkInDto: CheckInDto, userId: string): Promise<CheckIn | null> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: checkInDto.reservationId },
      relations: ['room', 'room.roomType', 'guest', 'consumptions', 'consumptions.inventoryItem'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.estado !== 'confirmada') {
      throw new BadRequestException(
        `La reserva debe estar confirmada para hacer check-in (estado actual: ${reservation.estado})`,
      );
    }

    const existingCheckIn = await this.checkInRepository.findOne({
      where: { reservationId: checkInDto.reservationId },
    });
    if (existingCheckIn) {
      throw new ConflictException('Esta reserva ya tiene un check-in registrado');
    }

    if (!['disponible', 'reservada'].includes(reservation.room.estado)) {
      throw new ConflictException(
        `La habitación no está disponible (estado: ${reservation.room.estado})`,
      );
    }

    if (checkInDto.companions?.length) {
      const existingDocs = (
        await this.reservationGuestRepository.find({
          where: { reservationId: checkInDto.reservationId },
        })
      ).map((rg) => rg.documento);

      const newRecords = [];
      for (const c of checkInDto.companions) {
        let guest = await this.guestRepository.findOne({ where: { documento: c.documento } });
        if (!guest) {
          guest = this.guestRepository.create({
            nombres: c.nombres,
            apellidos: c.apellidos,
            documento: c.documento,
            nacionalidad: c.nacionalidad,
            telefono: c.telefono || '',
            email: c.email || '',
          });
          guest = await this.guestRepository.save(guest);
        }
        if (!existingDocs.includes(c.documento)) {
          newRecords.push(
            this.reservationGuestRepository.create({
              nombres: c.nombres,
              apellidos: c.apellidos,
              documento: c.documento,
              nacionalidad: c.nacionalidad,
              telefono: c.telefono,
              email: c.email,
              reservationId: checkInDto.reservationId,
            }),
          );
        }
      }
      if (newRecords.length) {
        await this.reservationGuestRepository.save(newRecords);
      }
    }

    const checkIn = this.checkInRepository.create({
      reservationId: checkInDto.reservationId,
      userId,
      fechaHora: new Date(),
      observaciones: checkInDto.observaciones,
    });

    await this.checkInRepository.save(checkIn);
    await this.reservationRepository.update(reservation.id, { estado: 'checkin' });
    await this.roomRepository.update(reservation.roomId, { estado: 'ocupada' });

    // Process payment at check-in if provided
    if (checkInDto.pagoMonto && checkInDto.pagoMonto > 0 && checkInDto.pagoMetodoPagoId) {
      await this.processCheckInPayment(reservation, checkInDto, userId);
    }

    return this.checkInRepository.findOne({
      where: { id: checkIn.id },
      relations: ['reservation', 'reservation.room', 'reservation.guest', 'user'],
    });
  }

  private async processCheckInPayment(
    reservation: Reservation,
    dto: CheckInDto,
    userId: string,
  ) {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: { estado: 'abierta' },
    });

    const pm = await this.paymentMethodsService.findOne(dto.pagoMetodoPagoId!);

    const payment = this.paymentRepository.create({
      roomId: reservation.roomId,
      reservationId: reservation.id,
      userId,
      monto: dto.pagoMonto!,
      metodoPagoId: dto.pagoMetodoPagoId,
      comprobante: dto.pagoReferencia || '',
      observaciones: `Check-in ${reservation.codigo} - ${pm.nombre}`,
      fecha: new Date(),
    });
    const savedPayment = await this.paymentRepository.save(payment);

    const tipo = pm.tipo || 'otros';
    if (cashRegister) {
      cashRegister.totalVentas = Number(cashRegister.totalVentas) + dto.pagoMonto!;
      if (tipo === 'efectivo') cashRegister.totalEfectivo = Number(cashRegister.totalEfectivo) + dto.pagoMonto!;
      else if (tipo === 'transferencia') cashRegister.totalTransferencia = Number(cashRegister.totalTransferencia) + dto.pagoMonto!;
      else if (tipo === 'tarjeta') cashRegister.totalTarjeta = Number(cashRegister.totalTarjeta) + dto.pagoMonto!;
      else cashRegister.totalOtros = Number(cashRegister.totalOtros) + dto.pagoMonto!;
      cashRegister.cantidadTransacciones += 1;
      await this.cashRegisterRepository.save(cashRegister);
    }

    // Create Recibo de Caja for the check-in payment
    const noches = Math.ceil(
      (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaEntrada).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const precioNoche = Number(reservation.room?.roomType?.precioBase || 0);
    const itemsData: any[] = [];
    if (precioNoche > 0) {
      itemsData.push({
        concepto: `${reservation.room?.nombre || 'Habitación'} x ${noches} noche${noches > 1 ? 's' : ''}`,
        cantidad: noches,
        precioUnitario: precioNoche,
        subtotal: noches * precioNoche,
        tipo: 'habitacion',
      });
    }

    const recibo = await this.reciboCajaService.create({
      clienteNombre: reservation.guest?.nombres || 'Huésped',
      reservationId: reservation.id,
      fecha: new Date().toISOString().slice(0, 10),
      subtotal: dto.pagoMonto!,
      descuento: 0,
      total: dto.pagoMonto!,
      pagos: [{
        concepto: `Check-in ${reservation.codigo} - Pago inicial`,
        monto: dto.pagoMonto!,
        metodoPagoId: dto.pagoMetodoPagoId!,
        cuentaId: pm.financialAccountId || '',
        referenciaTipo: 'payment',
        referenciaId: savedPayment.id,
      }],
      items: itemsData,
    }, userId);

    // Create INGRESO movement
    if (pm.financialAccountId) {
      try {
        await this.financialMovementsService.create({
          accountId: pm.financialAccountId,
          tipo: 'INGRESO',
          monto: dto.pagoMonto!,
          concepto: `Check-in ${reservation.codigo} - Pago inicial`,
          referenciaTipo: 'payment',
          referenciaId: savedPayment.id,
          reciboId: recibo.id,
          cashRegisterId: cashRegister?.id,
        }, userId);
      } catch {
        // skip
      }
    }
  }

  async findByReservation(reservationId: string): Promise<CheckIn> {
    const checkIn = await this.checkInRepository.findOne({
      where: { reservationId },
      relations: ['reservation', 'reservation.room', 'reservation.guest', 'user'],
    });
    if (!checkIn) {
      throw new NotFoundException('Check-in no encontrado para esta reserva');
    }
    return checkIn;
  }
}
