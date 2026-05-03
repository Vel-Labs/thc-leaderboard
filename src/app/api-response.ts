"use client";

export type ApiResult<T> = T & {
  error?: string;
};

export async function readApiResult<T>(response: Response, fallback: string): Promise<ApiResult<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiResult<T>;
  }

  const text = (await response.text()).trim();
  return {
    error: text.length ? normalizePlainError(text) : fallback,
  } as ApiResult<T>;
}

function normalizePlainError(text: string) {
  if (/an error occurred/i.test(text) || /function_invocation_timeout/i.test(text)) {
    return "Review generation took too long for the live request. Try again, or use a smaller public repository while the review queue is being wired.";
  }
  return text.slice(0, 240);
}
