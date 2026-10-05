export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}
