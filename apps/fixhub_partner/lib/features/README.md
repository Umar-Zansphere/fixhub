// Technician App — Core & Features Structure
//
// Shares the same Clean Architecture pattern as customer_app:
//
// lib/
// ├── core/ (config, network, router, storage, error, utils)
// ├── features/
// │ ├── auth/ (OTP login as TECHNICIAN role)
// │ ├── jobs/ (Active jobs, accept/reject, status updates)
// │ ├── history/ (Completed job history)
// │ └── profile/ (Technician profile, availability toggle)
// └── shared/ (common widgets, providers)
//
// Each feature follows: data/ → domain/ → presentation/
//
// Key differences from customer_app:
// - Login role is TECHNICIAN (not CUSTOMER)
// - Navigation: Jobs | History | Profile (not Home | Bookings | Alerts | Profile)
// - Job flow: View → Accept/Reject → En Route → In Progress → Complete
// - Availability toggle in profile
