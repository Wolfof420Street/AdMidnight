import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method: string; url: string }>();
    const path = req.url.split('?')[0];
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${req.method} ${path} +${Date.now() - start}ms`);
      }),
    );
  }
}

