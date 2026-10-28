const allowedServices = new Set(["web", "app", "design", "growth"]);
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

export function validateInquiry(value: unknown) {
  if (!value || typeof value !== "object") return { error: "invalid_request" } as const;
  const input = value as Record<string, unknown>;
  if (clean(input.website)) return { spam: true } as const;
  const name = clean(input.name), email = clean(input.email), message = clean(input.message);
  const services = Array.isArray(input.services) ? [...new Set(input.services.filter((s): s is string => typeof s === "string" && allowedServices.has(s)))] : [];
  if (name.length < 2 || name.length > 100) return { error: "invalid_name" } as const;
  if (email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid_email" } as const;
  if (message.length < 10 || message.length > 5000) return { error: "invalid_message" } as const;
  if (!services.length) return { error: "missing_service" } as const;
  const id = clean(input.id);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return { error: "invalid_id" } as const;
  return { data: { id, name, email: email.toLowerCase(), message, services, timeframe: clean(input.timeframe).slice(0, 100) || "À définir", language: input.language === "en" ? "en" : "fr" } } as const;
}
