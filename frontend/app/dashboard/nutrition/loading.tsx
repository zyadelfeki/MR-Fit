export default function NutritionLoading() {
    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 flex justify-between items-center">
                            <div className="space-y-2 w-1/3">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            </div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
