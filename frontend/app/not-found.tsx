import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-9xl font-extrabold text-indigo-600">404</h1>
                <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Page Not Found</h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Sorry, we couldn't find the page you're looking for.</p>
                <div className="mt-8 relative hidden sm:block">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
