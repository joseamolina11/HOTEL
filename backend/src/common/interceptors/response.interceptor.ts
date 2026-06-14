import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WrappedResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, WrappedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        const isPaginated = responseData?.items && responseData?.meta;

        if (isPaginated) {
          return {
            success: true,
            data: responseData.items,
            message: 'Listado obtenido exitosamente',
            timestamp: new Date().toISOString(),
            meta: responseData.meta,
          };
        }

        return {
          success: true,
          data: responseData ?? null,
          message: 'Operación exitosa',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
