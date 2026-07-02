import { createHmac, timingSafeEqual } from 'node:crypto';

type JwtPayload = Record<string, unknown>;

function toBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signSegment(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function signJwt(
  payload: JwtPayload,
  secret: string,
  expiresInSeconds: number,
): string {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      exp: nowInSeconds + expiresInSeconds,
      iat: nowInSeconds,
    }),
  );
  const unsignedToken = `${header}.${body}`;
  const signature = signSegment(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    throw new Error('Invalid token structure.');
  }

  const expectedSignature = signSegment(`${header}.${body}`, secret);

  if (
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error('Invalid token signature.');
  }

  const payload = JSON.parse(fromBase64Url(body)) as JwtPayload & {
    exp?: number;
  };

  if (typeof payload.exp !== 'number') {
    throw new Error('Missing token expiration.');
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired.');
  }

  return payload;
}
