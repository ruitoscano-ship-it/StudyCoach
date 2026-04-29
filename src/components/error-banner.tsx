export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}
