import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch()
export class CatchAllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchAllExceptionsFilter.name);
  private readonly httpExceptionFilter = new HttpExceptionFilter();

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      this.httpExceptionFilter.catch(exception, host);
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    this.httpExceptionFilter.catch(
      new InternalServerErrorException(),
      host,
    );
  }
}
