export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Daily quote skeleton */}
      <div className="h-11 w-full rounded-xl skeleton" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-lg skeleton hidden sm:block" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-800 bg-[#161616] p-6 h-[140px] flex flex-col justify-between">
            <div className="h-10 w-10 rounded-xl skeleton" />
            <div className="space-y-2">
              <div className="h-7 w-20 rounded skeleton" />
              <div className="h-4 w-28 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Magic Input Skeleton */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-[#161616] p-6 h-[220px] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-6 w-40 rounded skeleton" />
            <div className="h-16 w-full rounded-xl skeleton" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 rounded skeleton" />
            <div className="h-10 w-24 rounded-lg skeleton" />
          </div>
        </div>

        {/* Today at a Glance Skeleton */}
        <div className="lg:col-span-1 rounded-2xl border border-neutral-800 bg-[#161616] p-6 h-[220px] flex flex-col justify-between">
          <div>
            <div className="h-6 w-36 rounded skeleton mb-5" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-4 w-16 rounded skeleton" />
                    <div className="h-4 w-24 rounded skeleton" />
                  </div>
                  <div className="h-2 w-full rounded-full skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions skeleton */}
      <div>
        <div className="h-6 w-32 rounded skeleton mb-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-[#161616] p-5 h-[160px] space-y-3">
              <div className="h-8 w-8 rounded-lg skeleton" />
              <div className="h-5 w-28 rounded skeleton" />
              <div className="h-4 w-full rounded skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
