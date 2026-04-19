import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-9xl font-extrabold text-gray-900 dark:text-white">404</h1>
                <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Page Not Found</h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Sorry, we couldn't find the page you're looking for.</p>
                <div className="mt-8 relative hidden sm:block">
                    <Link
                        href="/dashboard"
                        className="btn-brand"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
