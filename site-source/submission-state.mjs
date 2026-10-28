const clean = value => typeof value === 'string' ? value.trim() : '';

export function inquirySignature(payload) {
  return JSON.stringify([
    clean(payload.name), clean(payload.email).toLowerCase(), clean(payload.message),
    [...new Set(Array.isArray(payload.services) ? payload.services : [])].sort(),
    clean(payload.timeframe) || 'À définir',
  ]);
}

export function submissionFor(previous, payload, createId) {
  const signature = inquirySignature(payload);
  return previous?.signature === signature ? previous : { id: createId(), signature };
}
