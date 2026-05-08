import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  GoneException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { WeChatApiException } from '../exceptions/wechat-api.exception';

function sanitizeExceptionResponse(response: unknown, messageOverride?: string): unknown {
  if (typeof response === 'string') return messageOverride ?? response;
  if (typeof response !== 'object' || response === null) return response;
  const obj = { ...(response as Record<string, unknown>) };
  // Remove fields that may leak internal details
  delete obj.stack;
  delete obj.trace;
  delete obj.errmsg;
  delete obj.name;
  if (messageOverride) {
    obj.message = messageOverride;
    delete obj.error;
  }
  return obj;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : (exceptionResponse as any).message || exception.message;

    // Map HTTP exceptions to business error codes as documented in DEVELOPMENT.md §16.2
    let businessCode: number | null = null;
    if (exception instanceof BadRequestException) {
      businessCode = 40001;
    } else if (exception instanceof UnauthorizedException) {
      businessCode = 40101;
    } else if (exception instanceof ForbiddenException) {
      businessCode = 40301;
    } else if (exception instanceof NotFoundException) {
      businessCode = 40401;
    } else if (exception instanceof ConflictException) {
      businessCode = 40901;
    } else if (exception instanceof GoneException) {
      businessCode = 41001;
    } else if (status === 429) {
      businessCode = 42901;
    } else if (exception instanceof WeChatApiException) {
      businessCode = 50002;
    } else if (exception instanceof InternalServerErrorException) {
      businessCode = 50001;
    } else {
      businessCode = 50001;
    }

    const defaults: Record<string, string> = {
      '40001': '参数错误',
      '40101': '未登录',
      '40301': '无权限操作',
      '40401': '房间不存在',
      '40901': '已在房间中',
      '41001': '接口已废弃',
      '42901': '请求过于频繁',
      '50001': '服务器内部错误',
      '50002': '微信服务暂时不可用，请稍后重试',
    };

    const isProduction = process.env.NODE_ENV === 'production';
    const defaultMessage = defaults[businessCode.toString()];
    const isServerError = status >= 500;
    const finalMessage = message ? (Array.isArray(message) ? message[0] : message) : defaultMessage;
    const publicMessage = isServerError ? defaultMessage : finalMessage;

    const responseBody: Record<string, unknown> = {
      code: businessCode,
      message: isProduction ? defaultMessage : publicMessage,
    };
    if (!isProduction) {
      responseBody.error = sanitizeExceptionResponse(
        exceptionResponse,
        isServerError ? defaultMessage : undefined,
      );
    }

    response.status(status).json(responseBody);
  }
}
