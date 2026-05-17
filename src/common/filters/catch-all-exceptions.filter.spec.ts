import { ArgumentsHost, InternalServerErrorException } from '@nestjs/common';
import { CatchAllExceptionsFilter } from './catch-all-exceptions.filter';

describe('CatchAllExceptionsFilter', () => {
  it('wraps non-HttpException as standard API error body', () => {
    const filter = new CatchAllExceptionsFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('db crash'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 50001, message: expect.any(String) }),
    );
  });

  it('delegates HttpException to HttpExceptionFilter', () => {
    const filter = new CatchAllExceptionsFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new InternalServerErrorException('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 50001 }),
    );
  });
});
