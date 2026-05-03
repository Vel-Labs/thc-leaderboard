import "server-only";

export class RequestGuardError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function assertJsonRequest(request: Request, maxBytes: number) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new RequestGuardError("Content-Type must be application/json.", 415);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new RequestGuardError("Invalid request size.", 400);
    }
    if (parsed > maxBytes) {
      throw new RequestGuardError("Request body is too large.", 413);
    }
  }
}
