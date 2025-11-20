import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class RpcInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data) => {
        const resp = {
          status: 'success',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data,
        };
        console.log('respo', resp);

        return resp;
      }),
      catchError((err) => {
        const resp = {
          status: 'error',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          error: err,
        };
        console.log('resp2', resp);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return throwError(() => new RpcException(err));
      }),
    );
  }
}
