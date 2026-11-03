import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IncomingMessage, ServerResponse } from 'http';
import { createPhoneAuthMiddleware } from '../phoneAuthMiddleware.ts';

describe('phoneAuthMiddleware', () => {
  let middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
  let req: Partial<IncomingMessage>;
  let res: Partial<ServerResponse>;
  let next: ReturnType<typeof vi.fn>;
  let endMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    middleware = createPhoneAuthMiddleware();
    next = vi.fn();
    endMock = vi.fn();

    req = {
      url: '/api/auth/phone/send-otp',
      method: 'POST',
      headers: {},
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from(JSON.stringify({ phoneNumber: '1234567890' }));
      }
    } as any;

    res = {
      setHeader: vi.fn(),
      end: endMock,
    } as any;
  });

  it('should return 405 when method is not POST or OPTIONS', async () => {
    req.method = 'GET';

    await middleware(req as IncomingMessage, res as ServerResponse, next as unknown as () => void);

    expect(res.statusCode).toBe(405);
    expect(endMock).toHaveBeenCalledWith(
      JSON.stringify({
        success: false,
        statusCode: 405,
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are supported.',
      })
    );
  });
});