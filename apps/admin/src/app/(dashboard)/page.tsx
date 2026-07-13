export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Bookings', value: '—', color: 'blue' },
          { label: 'Active Bookings', value: '—', color: 'green' },
          { label: 'Total Customers', value: '—', color: 'purple' },
          { label: 'Total Technicians', value: '—', color: 'orange' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TODO: Add recent bookings table, charts */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recent Bookings</h2>
        <p className="mt-4 text-gray-400">Booking table will be implemented here</p>
      </div>
    </div>
  );
}
