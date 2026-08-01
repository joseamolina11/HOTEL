import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MincitEnvio } from './entities/mincit-envio.entity';

const MINCIT_API_URL = process.env.MINCIT_API_URL || 'https://pms.mincit.gov.co/one/';
const MINCIT_TOKEN = process.env.MINCIT_TOKEN || 'RGtkiSVJDcwEVoptEBl5aNQ5ITo00udPuGeubIzy';

@Injectable()
export class MincitService {
  private readonly logger = new Logger(MincitService.name);
  private readonly maxIntentos = Number(process.env.MINCIT_MAX_INTENTOS || 5);
  private readonly retryMinutes = Number(process.env.MINCIT_RETRY_MINUTES || 30);

  constructor(
    @InjectRepository(MincitEnvio)
    private readonly envioRepository: Repository<MincitEnvio>,
  ) {}

  async registrarCheckIn(reservationId: string, payload: any): Promise<MincitEnvio | null> {
    const envio = this.envioRepository.create({
      reservationId,
      payload,
      estado: 'pendiente',
      intentos: 0,
      proximoIntento: new Date(),
    });
    const saved = await this.envioRepository.save(envio);
    this.intentarEnvio(saved.id);
    return this.envioRepository.findOne({ where: { id: saved.id } });
  }

  async intentarEnvio(id: string): Promise<void> {
    const envio = await this.envioRepository.findOne({ where: { id } });
    if (!envio || envio.estado === 'enviado' || envio.estado === 'fallido') return;

    try {
      const response = await fetch(MINCIT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${MINCIT_TOKEN}`,
        },
        body: JSON.stringify(envio.payload),
      });
      const raw = await response.text().catch(() => '');

      if (response.status === 201) {
        let body: any = null;
        try {
          body = raw ? JSON.parse(raw) : null;
        } catch {
          body = null;
        }
        envio.estado = 'enviado';
        envio.codigoRespuesta = body?.code != null ? String(body.code) : null;
        envio.respuestaRaw = raw || null;
        envio.enviadoAt = new Date();
        envio.ultimoError = null;
        envio.proximoIntento = null;
        this.logger.log(`MinCIT enviado OK (reserva ${envio.reservationId}): code=${envio.codigoRespuesta}`);
      } else {
        throw new Error(`MinCIT respondió HTTP ${response.status}: ${raw.slice(0, 300)}`);
      }
    } catch (error) {
      const message = (error as Error).message || 'Error desconocido';
      envio.intentos = Number(envio.intentos || 0) + 1;
      envio.ultimoError = message.slice(0, 500);
      if (envio.intentos >= this.maxIntentos) {
        envio.estado = 'fallido';
        envio.proximoIntento = null;
        this.logger.warn(`MinCIT agotó intentos (reserva ${envio.reservationId}): ${message}`);
      } else {
        envio.estado = 'pendiente';
        envio.proximoIntento = new Date(Date.now() + this.retryMinutes * 60 * 1000);
        this.logger.warn(
          `MinCIT falló (intento ${envio.intentos}/${this.maxIntentos}) reserva ${envio.reservationId}: ${message}`,
        );
      }
    }

    await this.envioRepository.save(envio);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cronReintentos(): Promise<void> {
    const now = new Date();
    const pendientes = await this.envioRepository.find({
      where: { estado: 'pendiente' },
    });
    for (const envio of pendientes) {
      if (envio.proximoIntento && envio.proximoIntento.getTime() <= now.getTime()) {
        await this.intentarEnvio(envio.id);
      }
    }
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.envioRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByReservation(reservationId: string) {
    return this.envioRepository.find({
      where: { reservationId },
      order: { createdAt: 'DESC' },
    });
  }

  async reintentar(id: string) {
    const envio = await this.envioRepository.findOne({ where: { id } });
    if (!envio) return null;
    envio.estado = 'pendiente';
    envio.intentos = 0;
    envio.proximoIntento = new Date();
    await this.envioRepository.save(envio);
    await this.intentarEnvio(id);
    return this.envioRepository.findOne({ where: { id } });
  }
}
