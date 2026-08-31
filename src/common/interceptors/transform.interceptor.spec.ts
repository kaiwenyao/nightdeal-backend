import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  it('wraps the handler response in the standard API envelope', async () => {
    const interceptor = new TransformInterceptor<{ hello: string }>();
    const context = {} as ExecutionContext;
    const next = {
      handle: () => of({ hello: 'world' }),
    } as unknown as CallHandler;

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      code: 0,
      message: 'success',
      data: { hello: 'world' },
    });
  });

  it('wraps primitive and null responses as well', async () => {
    const interceptor = new TransformInterceptor<string | null>();
    const context = {} as ExecutionContext;
    const next = {
      handle: () => of(null),
    } as unknown as CallHandler;

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ code: 0, message: 'success', data: null });
  });
});
