export function sanitizeCallbackPath(input: string | null | undefined) {
  if (!input) return "/";
  const trimmed = input.trim();
  if (!trimmed) return "/";
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("//")) return "/";
  return trimmed;
}
