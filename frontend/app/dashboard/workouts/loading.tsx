export default function WorkoutsLoading() {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 flex justify-between items-center">
                            <div className="space-y-3 w-1/2">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
