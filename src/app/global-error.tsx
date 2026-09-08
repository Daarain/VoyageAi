"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <h2 className="text-xl font-bold mb-3 text-white">Application Error</h2>
          <p className="text-sm text-slate-400 mb-6">An unexpected error occurred in the application root.</p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-cyan-400 text-slate-950 rounded-xl font-bold text-sm hover:bg-cyan-300 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
