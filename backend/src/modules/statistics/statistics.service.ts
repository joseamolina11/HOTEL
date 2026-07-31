import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StatisticsFilterDto } from './dto/statistics.dto';

export interface DateRow {
  fecha: string;
  pedidos: number;
  alojamientos: number;
  recargos: number;
  total: number;
}

@Injectable()
export class StatisticsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getGerencial(filters: StatisticsFilterDto) {
    const [salesByDate, paymentMethods, expensesByCategory, expensesByPaymentMethod] = await Promise.all([
      this.getSalesByDate(filters),
      this.getPaymentMethods(filters),
      this.getExpensesByCategory(filters),
      this.getExpensesByPaymentMethod(filters),
    ]);

    const totals = salesByDate.reduce<{ pedidos: number; alojamientos: number; recargos: number; ventas: number; egresos: number }>(
      (acc, row) => {
        acc.pedidos += row.pedidos;
        acc.alojamientos += row.alojamientos;
        acc.recargos += row.recargos;
        return acc;
      },
      { pedidos: 0, alojamientos: 0, recargos: 0, ventas: 0, egresos: 0 },
    );
    totals.ventas = totals.pedidos + totals.alojamientos + totals.recargos;
    totals.egresos = expensesByCategory.reduce((sum, e) => sum + e.total, 0);

    return {
      salesByDate,
      paymentMethods,
      expensesByCategory,
      expensesByPaymentMethod,
      totals,
    };
  }

  // ---------- Ventas por fecha (pedidos / alojamientos / recargos) ----------

  private async getSalesByDate({ desde, hasta }: StatisticsFilterDto): Promise<DateRow[]> {
    const map = new Map<string, DateRow>();

    // Pedidos: total de órdenes no borrador/no canceladas, por fecha de la orden.
    const { clause: oClause, params: oParams } = this.tsRange('o.fecha', desde, hasta);
    const orders: any[] = await this.run(
      `SELECT DATE(o.fecha) AS fecha, COALESCE(SUM(o.total), 0)::numeric AS total
       FROM orders o
       WHERE o.estado IN ('cargado', 'pendiente', 'pagado')
       ${oClause}
       GROUP BY DATE(o.fecha)
       ORDER BY DATE(o.fecha)`,
      oParams,
    );

    // Alojamientos: noches x tarifa por reserva facturada (checkout), atribuidos a la fecha de salida.
    const { clause: rClause, params: rParams } = this.tsRange('r.fecha_salida', desde, hasta);
    const lodgings: any[] = await this.run(
      `SELECT DATE(r.fecha_salida) AS fecha,
              COALESCE(SUM(
                GREATEST(0, CEIL(EXTRACT(EPOCH FROM (r.fecha_salida - r.fecha_entrada)) / 86400))
                * COALESCE(r.precio_base, rt.precio_base, 0)
              ), 0)::numeric AS total
       FROM reservations r
       JOIN rooms rm ON rm.id = r.room_id
       LEFT JOIN room_types rt ON rt.id = rm.room_type_id
       WHERE r.estado = 'checkout'
       ${rClause}
       GROUP BY DATE(r.fecha_salida)
       ORDER BY DATE(r.fecha_salida)`,
      rParams,
    );

    // Recargos: subtotal de recargos vigentes, por fecha del recargo.
    const { clause: sClause, params: sParams } = this.tsRange('s.fecha', desde, hasta);
    const surcharges: any[] = await this.run(
      `SELECT DATE(s.fecha) AS fecha, COALESCE(SUM(s.subtotal), 0)::numeric AS total
       FROM surcharges s
       WHERE s.deleted_at IS NULL AND s.estado <> 'borrador'
       ${sClause}
       GROUP BY DATE(s.fecha)
       ORDER BY DATE(s.fecha)`,
      sParams,
    );

    const add = (fecha: string | Date, key: keyof Omit<DateRow, 'fecha' | 'total'>, total: number) => {
      const f = this.toDateKey(fecha);
      const row = map.get(f) ?? { fecha: f, pedidos: 0, alojamientos: 0, recargos: 0, total: 0 };
      row[key] = Number(total || 0);
      map.set(f, row);
    };

    orders.forEach((r) => add(r.fecha, 'pedidos', r.total));
    lodgings.forEach((r) => add(r.fecha, 'alojamientos', r.total));
    surcharges.forEach((r) => add(r.fecha, 'recargos', r.total));

    let rows = [...map.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Completar días sin movimiento dentro del rango para una serie continua.
    if (desde && hasta) {
      const start = this.parseDateKey(desde);
      const end = this.parseDateKey(hasta);
      const filled: DateRow[] = [];
      for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = this.toDateKey(d);
        filled.push(map.get(key) ?? { fecha: key, pedidos: 0, alojamientos: 0, recargos: 0, total: 0 });
      }
      rows = filled;
    }

    rows.forEach((r) => (r.total = r.pedidos + r.alojamientos + r.recargos));
    return rows;
  }

  // ---------- Formas de pago (ventas recibidas) ----------

  private async getPaymentMethods({ desde, hasta }: StatisticsFilterDto) {
    const { clause, params } = this.tsRange('p.fecha', desde, hasta);
    const rows: any[] = await this.run(
      `SELECT pm.id, pm.nombre, pm.tipo,
              COALESCE(SUM(p.monto), 0)::numeric AS total,
              COUNT(p.id)::int AS cantidad
       FROM payments p
       LEFT JOIN payment_methods pm ON pm.id = p.metodo_pago_id
       WHERE 1=1 ${clause}
       GROUP BY pm.id, pm.nombre, pm.tipo
       ORDER BY total DESC`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre || 'Sin método',
      tipo: r.tipo || 'otros',
      total: Number(r.total),
      cantidad: Number(r.cantidad),
    }));
  }

  // ---------- Egresos por categoría ----------

  private async getExpensesByCategory({ desde, hasta }: StatisticsFilterDto) {
    const { clause, params } = this.dateRange('e.fecha', desde, hasta);
    const rows: any[] = await this.run(
      `SELECT ec.id, ec.nombre,
              COALESCE(SUM(e.monto), 0)::numeric AS total,
              COUNT(e.id)::int AS cantidad
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       WHERE 1=1 ${clause}
       GROUP BY ec.id, ec.nombre
       ORDER BY total DESC`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      total: Number(r.total),
      cantidad: Number(r.cantidad),
    }));
  }

  // ---------- Egresos por forma de pago ----------

  private async getExpensesByPaymentMethod({ desde, hasta }: StatisticsFilterDto) {
    const { clause, params } = this.dateRange('e.fecha', desde, hasta);
    const rows: any[] = await this.run(
      `SELECT pm.id, pm.nombre, pm.tipo,
              COALESCE(SUM(e.monto), 0)::numeric AS total,
              COUNT(e.id)::int AS cantidad
       FROM expenses e
       LEFT JOIN payment_methods pm ON pm.id = e.metodo_pago_id
       WHERE 1=1 ${clause}
       GROUP BY pm.id, pm.nombre, pm.tipo
       ORDER BY total DESC`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre || 'Sin método',
      tipo: r.tipo || 'otros',
      total: Number(r.total),
      cantidad: Number(r.cantidad),
    }));
  }

  // ---------- Helpers ----------

  private async run<T = any>(sql: string, params: any[]): Promise<T[]> {
    return this.dataSource.query(sql, params);
  }

  /** Rango sobre columnas timestamptz (>= inicio, < fin+1) para aprovechar índices. */
  private tsRange(column: string, desde?: string, hasta?: string) {
    const where: string[] = [];
    const params: any[] = [];
    if (desde) {
      where.push(`${column} >= $${params.length + 1}`);
      params.push(`${desde}T00:00:00`);
    }
    if (hasta) {
      where.push(`${column} < $${params.length + 1}`);
      params.push(`${hasta}T23:59:59.999`);
    }
    return { clause: where.length ? `AND ${where.join(' AND ')}` : '', params };
  }

  /** Rango sobre columnas date (>= inicio, <= fin). */
  private dateRange(column: string, desde?: string, hasta?: string) {
    const where: string[] = [];
    const params: any[] = [];
    if (desde) {
      where.push(`${column} >= $${params.length + 1}`);
      params.push(desde);
    }
    if (hasta) {
      where.push(`${column} <= $${params.length + 1}`);
      params.push(hasta);
    }
    return { clause: where.length ? `AND ${where.join(' AND ')}` : '', params };
  }

  private parseDateKey(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private toDateKey(value: string | Date): string {
    const d = value instanceof Date ? value : this.parseDateKey(String(value).slice(0, 10));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
