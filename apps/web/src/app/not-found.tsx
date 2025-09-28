export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-matcha-300 to-creme-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ink-800 mb-4">404 - Not Found</h1>
        <p className="text-ink-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <a 
          href="/"
          className="bg-matcha-400 hover:bg-matcha-500 text-white px-6 py-3 rounded-xl transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
