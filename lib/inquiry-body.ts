// Enough for every permitted field, including UTF-8 text, without buffering an unlimited body.
export const MAX_INQUIRY_BYTES = 32_768;

export async function readInquiryBody(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_INQUIRY_BYTES) {
    return { error: "request_too_large", status: 413 } as const;
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: "invalid_json", status: 400 } as const;
  const decoder = new TextDecoder();
  let bytes = 0, raw = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_INQUIRY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { error: "request_too_large", status: 413 } as const;
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    return { body: JSON.parse(raw) as unknown };
  } catch {
    return { error: "invalid_json", status: 400 } as const;
  } finally {
    reader.releaseLock();
  }
}
