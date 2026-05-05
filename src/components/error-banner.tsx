export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mb-4 rounded-2xl border border-[#f3d8cf] bg-[#fff4ef] px-4 py-3 text-sm font-medium text-orange-950"
      role="alert"
    >
      {message}
    </p>
  );
}
