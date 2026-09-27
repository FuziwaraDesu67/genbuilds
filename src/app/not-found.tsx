export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-darker rounded-2xl p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-6">404</div>
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or the UID is invalid.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
