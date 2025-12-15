
export class RetryPolicy {
constructor(
private readonly maxRetries: number,
private readonly baseDelayMs: number
) {}

async execute<T>(operation: () => Promise<T>): Promise<T> {
let lastError: any = null;

for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
  try {
    return await operation();
  } catch (err) {
    lastError = err;

    if (attempt === this.maxRetries) break;

    const delay = this.baseDelayMs * attempt;
    await new Promise(res => setTimeout(res, delay));
  }
}

throw lastError;


}
}
