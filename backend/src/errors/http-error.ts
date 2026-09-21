export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const badRequest = (message: string): HttpError => new HttpError(400, message);

export const unauthorized = (message = 'Authentication required.'): HttpError =>
  new HttpError(401, message);

export const conflict = (message: string): HttpError => new HttpError(409, message);
