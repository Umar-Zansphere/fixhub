# FixHub

> Hyperlocal Electrical & Home Appliance Repair Platform

![NestJS](https://img.shields.io/badge/NestJS-11-ea2845?style=flat-square)
![Flutter](https://img.shields.io/badge/Flutter-3.24-02569B?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square)

Urban Company-like platform focused initially on Electrical services, launching in Kolathur, Chennai.

---

## 📁 Project Structure

```
fixhub/
├── apps/
│   ├── backend/          # NestJS REST API
│   ├── admin/            # Next.js Admin Panel
│   ├── customer_app/     # Flutter Customer App
│   └── technician_app/   # Flutter Technician App
├── packages/
│   └── shared/           # Shared TypeScript contracts
├── docker/               # Dockerfiles
├── docker-compose.yml    # Dev infrastructure
└── docker-compose.prod.yml
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x (via nvm)
- **pnpm** >= 9.x
- **Docker & Docker Compose**
- **Flutter SDK** >= 3.24 (see [Flutter Setup](#flutter-sdk-setup) below)
- **Android Studio** (installed) with JRE 21

### 1. Clone & Install

```bash
cd /home/umar23-zan/projects/fixhub

# Install Node.js dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your values
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL + Redis
docker compose up -d

# Verify services are running
docker compose ps
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed initial data (admin user, categories, service areas)
pnpm db:seed
```

### 4. Start Backend

```bash
pnpm dev:backend
# API: http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs
```

### 5. Start Admin Panel

```bash
pnpm dev:admin
# Admin: http://localhost:3001
```

### 6. Run Flutter Apps

```bash
cd apps/customer_app
flutter pub get
flutter run

# In another terminal
cd apps/technician_app
flutter pub get
flutter run
```

---

## 🔧 Flutter SDK Setup

Since Flutter SDK is not installed on your WSL or root machine, follow these steps:

### Option A: Install Flutter on Windows (Recommended for Android Studio users)

Since Android Studio is already installed:

1. **Download Flutter SDK:**

   ```powershell
   # In PowerShell (Windows)
   cd C:\Users\ADMIN
   git clone https://github.com/flutter/flutter.git -b stable
   ```

2. **Add to PATH:**

   ```powershell
   # Add to system PATH (run as Administrator)
   [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\ADMIN\flutter\bin", "User")
   ```

3. **Restart terminal and verify:**

   ```powershell
   flutter --version
   flutter doctor
   ```

4. **Configure Android Studio:**
   - Open Android Studio → Settings → Plugins → Install "Flutter" plugin
   - Settings → Languages & Frameworks → Flutter → Set SDK path to `C:\Users\ADMIN\flutter`
   - Ensure Android SDK and JRE 21 are configured

5. **Accept Android licenses:**
   ```powershell
   flutter doctor --android-licenses
   ```

### Option B: Install Flutter on WSL (For CLI-only development)

```bash
# In WSL (Ubuntu-24.04)

# Install dependencies
sudo apt update
sudo apt install -y curl git unzip xz-utils zip libglu1-mesa

# Download Flutter
cd ~
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
flutter --version
flutter doctor

# Note: For Android builds in WSL, you need Android SDK:
# Set ANDROID_HOME to your Android SDK path
# You may need to share the Android SDK from Windows:
# export ANDROID_HOME=/mnt/c/Users/ADMIN/AppData/Local/Android/Sdk
```

### Option C: Use FVM (Flutter Version Manager) — Recommended for Teams

```bash
# Install FVM
dart pub global activate fvm

# Install Flutter version
fvm install stable
fvm use stable

# Use via fvm
fvm flutter run
```

### Post-Installation: Generate Code

After Flutter SDK is available:

```bash
cd apps/customer_app
flutter pub get
dart run build_runner build --delete-conflicting-outputs

cd ../technician_app
flutter pub get
dart run build_runner build --delete-conflicting-outputs
```

---

## 📚 Available Scripts

| Script               | Description                      |
| -------------------- | -------------------------------- |
| `pnpm dev:backend`   | Start backend in watch mode      |
| `pnpm dev:admin`     | Start admin panel in dev mode    |
| `pnpm build:backend` | Build backend for production     |
| `pnpm build:admin`   | Build admin panel for production |
| `pnpm db:generate`   | Generate Prisma client           |
| `pnpm db:migrate`    | Run database migrations          |
| `pnpm db:seed`       | Seed database with initial data  |
| `pnpm db:studio`     | Open Prisma Studio GUI           |
| `pnpm lint`          | Lint all packages                |
| `pnpm format`        | Format all files                 |
| `pnpm docker:dev`    | Start dev infrastructure         |
| `pnpm docker:down`   | Stop infrastructure              |

---

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

### Backend Module Structure

```
src/modules/<module>/
├── <module>.module.ts      # NestJS module definition
├── controllers/            # HTTP request handlers (thin)
├── services/               # Business logic
├── repositories/           # Database access (Prisma)
├── dto/                    # Data transfer objects
├── interfaces/             # TypeScript interfaces
├── guards/                 # Auth/role guards
├── decorators/             # Custom decorators
├── processors/             # BullMQ job processors
├── strategies/             # Passport strategies
└── constants/              # Module constants
```

### Flutter Feature Structure

```
lib/features/<feature>/
├── data/
│   ├── datasources/        # API calls
│   ├── models/             # Freezed data models
│   └── repositories/       # Repository implementations
├── domain/
│   ├── entities/           # Freezed domain entities
│   ├── repositories/       # Abstract repository contracts
│   └── usecases/           # Business logic
└── presentation/
    ├── providers/          # Riverpod state management
    ├── screens/            # Page widgets
    └── widgets/            # Reusable UI components
```

---

## 🔑 API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Module        | Prefix           | Auth          |
| ------------- | ---------------- | ------------- |
| Auth          | `/auth`          | Public        |
| Customer      | `/customers`     | Customer      |
| Technician    | `/technicians`   | Technician    |
| Bookings      | `/bookings`      | Authenticated |
| Payments      | `/payments`      | Mixed         |
| Notifications | `/notifications` | Authenticated |
| Admin         | `/admin`         | Admin         |
| Reports       | `/reports`       | Admin         |

Full API documentation available at `/api/docs` (Swagger UI).

---

## 🐳 Docker

### Development

```bash
docker compose up -d     # Start PostgreSQL + Redis
docker compose down       # Stop all
docker compose logs -f    # View logs
```

### Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 📐 Conventions

### Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add booking creation endpoint
fix: resolve OTP expiration race condition
docs: update API documentation
chore: upgrade NestJS to v11
```

### Branch Naming

```
feature/booking-creation
fix/otp-validation
chore/docker-setup
```

### Code Style

- **TypeScript**: ESLint + Prettier (auto-formatted on commit)
- **Dart**: flutter_lints + custom rules (see analysis_options.yaml)
- **Naming**: camelCase for variables/functions, PascalCase for classes, UPPER_SNAKE for constants

---

## 🗺️ Roadmap

- [x] Project foundation & architecture
- [ ] Auth module (OTP login, JWT tokens)
- [ ] Service catalog (categories, sub-services)
- [ ] Booking creation flow
- [ ] Payment integration (Razorpay)
- [ ] Push notifications (FCM)
- [ ] Technician job management
- [ ] Admin dashboard
- [ ] Customer app UI
- [ ] Technician app UI
- [ ] Admin panel UI

---

## 📄 License

Private — All rights reserved.
