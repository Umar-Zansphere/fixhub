export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-white lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-blue-600">FixHub</h1>
        </div>
        <nav className="space-y-1 p-4">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Bookings', href: '/dashboard/bookings' },
            { label: 'Technicians', href: '/dashboard/technicians' },
            { label: 'Categories', href: '/dashboard/categories' },
            { label: 'Service Areas', href: '/dashboard/service-areas' },
            { label: 'Settings', href: '/dashboard/settings' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          {/* TODO: Add user menu, notifications */}
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
