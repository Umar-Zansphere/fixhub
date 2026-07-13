export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
        {/* TODO: Add filters, search */}
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-gray-400">Bookings data table will be implemented here</p>
        {/* TODO: Implement DataTable with columns: ID, Customer, Service, Status, Date, Amount, Actions */}
      </div>
    </div>
  );
}
