import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================
// SEED STRATEGY
// ============================================================
// Layer 1: Foundation — Admin user, permissions
// Layer 2: Geography — Service areas (Kolathur pilot)
// Layer 3: Catalog — Categories + sub-services (real pricing)
//
// Rules:
//   • Idempotent — safe to run multiple times (upsert by natural keys)
//   • Production-safe — no test data
//   • Ordered — permissions → user → geography → catalog
// ============================================================

async function main() {
  console.log('🌱 Starting FixHub database seed...\n');

  // ── Layer 1: Permissions ──────────────────────────────────

  const permissions = [
    // Booking
    { action: 'booking:create', description: 'Create a new booking' },
    { action: 'booking:read', description: 'View booking details' },
    { action: 'booking:read:own', description: 'View own bookings' },
    { action: 'booking:update', description: 'Update any booking' },
    { action: 'booking:cancel', description: 'Cancel a booking' },
    { action: 'booking:assign', description: 'Assign technician to booking' },
    // Technician
    { action: 'technician:read', description: 'View technician details' },
    { action: 'technician:verify', description: 'Verify a technician' },
    { action: 'technician:manage', description: 'Manage technician profiles' },
    { action: 'technician:availability', description: 'Toggle own availability' },
    { action: 'technician:job:accept', description: 'Accept an assigned job' },
    { action: 'technician:job:update', description: 'Update job status' },
    // Customer
    { action: 'customer:read', description: 'View customer details' },
    { action: 'customer:read:own', description: 'View own profile' },
    { action: 'customer:update:own', description: 'Update own profile' },
    { action: 'customer:address:manage', description: 'Manage own addresses' },
    // Catalog
    { action: 'category:read', description: 'View categories' },
    { action: 'category:manage', description: 'Create/update/delete categories' },
    { action: 'service:read', description: 'View sub-services' },
    { action: 'service:manage', description: 'Create/update/delete sub-services' },
    { action: 'service_area:read', description: 'View service areas' },
    { action: 'service_area:manage', description: 'Create/update/delete service areas' },
    // Payment
    { action: 'payment:create', description: 'Initiate payment' },
    { action: 'payment:read', description: 'View payment details' },
    { action: 'payment:refund', description: 'Issue refund' },
    // Review
    { action: 'review:create', description: 'Submit a review' },
    { action: 'review:read', description: 'View reviews' },
    // Admin
    { action: 'admin:dashboard', description: 'View admin dashboard' },
    { action: 'admin:reports', description: 'Access reports' },
    { action: 'admin:audit_logs', description: 'View audit logs' },
    // Notification
    { action: 'notification:read:own', description: 'View own notifications' },
    { action: 'notification:send', description: 'Send notifications' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`  ✅ ${permissions.length} permissions seeded`);

  // ── Layer 1: Role-Permission Mappings ─────────────────────

  const customerPermissions = [
    'booking:create',
    'booking:read:own',
    'booking:cancel',
    'customer:read:own',
    'customer:update:own',
    'customer:address:manage',
    'category:read',
    'service:read',
    'service_area:read',
    'payment:create',
    'review:create',
    'review:read',
    'notification:read:own',
  ];

  const technicianPermissions = [
    'booking:read:own',
    'technician:availability',
    'technician:job:accept',
    'technician:job:update',
    'category:read',
    'service:read',
    'service_area:read',
    'review:read',
    'notification:read:own',
  ];

  // Admin gets everything
  const allPermissionActions = permissions.map((p) => p.action);

  const rolePermissionMap: Array<{ role: Role; actions: string[] }> = [
    { role: Role.CUSTOMER, actions: customerPermissions },
    { role: Role.TECHNICIAN, actions: technicianPermissions },
    { role: Role.ADMIN, actions: allPermissionActions },
  ];

  for (const { role, actions } of rolePermissionMap) {
    for (const action of actions) {
      const permission = await prisma.permission.findUnique({ where: { action } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }
  console.log('  ✅ Role-permission mappings seeded');

  // ── Layer 1: Admin User ───────────────────────────────────

  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {
      password: adminPassword,
    },
    create: {
      phone: '+919999999999',
      name: 'FixHub Admin',
      email: 'admin@fixhub.in',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`  ✅ Admin user: ${adminUser.phone} (${adminUser.id})`);

  // ── Layer 2: Service Areas (Kolathur Pilot) ───────────────

  const serviceAreas = [
    { name: 'Kolathur', pincode: '600099', city: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Villivakkam', pincode: '600049', city: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Perambur', pincode: '600011', city: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Madhavaram', pincode: '600060', city: 'Chennai', state: 'Tamil Nadu' },
  ];

  for (const area of serviceAreas) {
    await prisma.serviceArea.upsert({
      where: { pincode: area.pincode },
      update: { name: area.name },
      create: { ...area, isActive: area.pincode === '600099' }, // Only Kolathur active for pilot
    });
  }
  console.log(`  ✅ ${serviceAreas.length} service areas seeded (Kolathur active)`);

  // ── Layer 3: Categories ───────────────────────────────────

  const categories = [
    { name: 'Electrical', slug: 'electrical', sortOrder: 1, isActive: true },
    { name: 'AC Service', slug: 'ac-service', sortOrder: 2, isActive: false },
    { name: 'Plumbing', slug: 'plumbing', sortOrder: 3, isActive: false },
    { name: 'Cleaning', slug: 'cleaning', sortOrder: 4, isActive: false },
    { name: 'Painting', slug: 'painting', sortOrder: 5, isActive: false },
    { name: 'Carpentry', slug: 'carpentry', sortOrder: 6, isActive: false },
    { name: 'Appliance Repair', slug: 'appliance-repair', sortOrder: 7, isActive: false },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`  ✅ ${categories.length} categories seeded (Electrical active)`);

  // ── Layer 3: Sub-Services (Electrical MVP) ────────────────

  const electrical = await prisma.category.findUnique({
    where: { slug: 'electrical' },
  });

  if (electrical) {
    const subServices = [
      {
        name: 'Fan Repair',
        slug: 'fan-repair',
        description: 'Ceiling fan, table fan, exhaust fan repair and installation',
        basePrice: 299,
        estimatedDurationMins: 60,
        sortOrder: 1,
      },
      {
        name: 'Switch & Socket',
        slug: 'switch-socket',
        description: 'Switch board, socket, plug point repair and replacement',
        basePrice: 199,
        estimatedDurationMins: 30,
        sortOrder: 2,
      },
      {
        name: 'Wiring',
        slug: 'wiring',
        description: 'New wiring, rewiring, and wire repair',
        basePrice: 499,
        estimatedDurationMins: 120,
        sortOrder: 3,
      },
      {
        name: 'MCB & Fuse',
        slug: 'mcb-fuse',
        description: 'MCB, fuse box, circuit breaker repair and replacement',
        basePrice: 349,
        estimatedDurationMins: 45,
        sortOrder: 4,
      },
      {
        name: 'Light Installation',
        slug: 'light-installation',
        description: 'LED light, tube light, bulb installation and repair',
        basePrice: 249,
        estimatedDurationMins: 45,
        sortOrder: 5,
      },
      {
        name: 'Inverter & Stabilizer',
        slug: 'inverter-stabilizer',
        description: 'Inverter, UPS, voltage stabilizer repair and installation',
        basePrice: 599,
        estimatedDurationMins: 90,
        sortOrder: 6,
      },
    ];

    for (const sub of subServices) {
      await prisma.subService.upsert({
        where: { slug: sub.slug },
        update: {
          basePrice: sub.basePrice,
          estimatedDurationMins: sub.estimatedDurationMins,
          sortOrder: sub.sortOrder,
        },
        create: {
          ...sub,
          categoryId: electrical.id,
          isActive: true,
        },
      });
    }
    console.log(`  ✅ ${subServices.length} electrical sub-services seeded`);

    // ── Layer 4: Technician for testing ───────────────────────
    const technicianUser = await prisma.user.upsert({
      where: { phone: '+918888888888' },
      update: {},
      create: {
        phone: '+918888888888',
        name: 'Test Technician',
        email: 'technician@fixhub.in',
        role: Role.TECHNICIAN,
        isActive: true,
      },
    });

    const technician = await prisma.technician.upsert({
      where: { userId: technicianUser.id },
      update: { isAvailable: true, verificationStatus: 'VERIFIED' },
      create: {
        userId: technicianUser.id,
        isAvailable: true,
        verificationStatus: 'VERIFIED',
      },
    });

    const kolathurArea = await prisma.serviceArea.findUnique({
      where: { pincode: '600099' }
    });

    if (kolathurArea) {
      await prisma.technicianServiceArea.upsert({
        where: {
          technicianId_serviceAreaId: {
            technicianId: technician.id,
            serviceAreaId: kolathurArea.id,
          }
        },
        update: {},
        create: {
          technicianId: technician.id,
          serviceAreaId: kolathurArea.id,
        }
      });
    }

    const dbSubServices = await prisma.subService.findMany({
      where: { categoryId: electrical.id }
    });

    for (const sub of dbSubServices) {
      await prisma.technicianSpecialization.upsert({
        where: {
          technicianId_subServiceId: {
            technicianId: technician.id,
            subServiceId: sub.id,
          }
        },
        update: {},
        create: {
          technicianId: technician.id,
          subServiceId: sub.id,
        }
      });
    }
    console.log(`  ✅ Test technician seeded (mapped to Kolathur & ${dbSubServices.length} sub-services)`);
  }

  console.log('\n🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
