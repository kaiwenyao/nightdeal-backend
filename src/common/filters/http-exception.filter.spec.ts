import { ArgumentsHost, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { WeChatApiException } from '../exceptions/wechat-api.exception';

describe('HttpExceptionFilter', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  function createHost() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as ArgumentsHost;

    return { host, status, json };
  }

  it('does not expose internal 5xx details in development responses', () => {
    process.env.NODE_ENV = 'development';
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new InternalServerErrorException('database password leaked'), host);

    const body = json.mock.calls[0][0];
    expect(body).toEqual(expect.objectContaining({
      code: 50001,
      message: '服务器内部错误',
      error: expect.objectContaining({ message: '服务器内部错误' }),
    }));
    expect(JSON.stringify(body)).not.toContain('database password leaked');
  });

  it('uses a safe public message for WeChat API failures', () => {
    process.env.NODE_ENV = 'development';
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new WeChatApiException('invalid appsecret from upstream'), host);

    const body = json.mock.calls[0][0];
    expect(body).toEqual(expect.objectContaining({
      code: 50002,
      message: '微信服务暂时不可用，请稍后重试',
      error: '微信服务暂时不可用，请稍后重试',
    }));
    expect(JSON.stringify(body)).not.toContain('invalid appsecret');
  });

  it('keeps client-side 4xx messages visible in development', () => {
    process.env.NODE_ENV = 'development';
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new BadRequestException('昵称不能为空'), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: 40001,
      message: '昵称不能为空',
    }));
  });
});
