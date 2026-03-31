const {
  PrismaClient,
  HostelType,
  UserStatus,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const roleSeeds = [
  { code: "ADMIN", name: "Administrator" },
  { code: "WARDEN", name: "Warden" },
  { code: "STUDENT", name: "Student" },
  { code: "GATEKEEPER", name: "Gatekeeper" },
  { code: "SUPERVISOR", name: "Supervisor" },
  { code: "ACCOUNTANT", name: "Accountant" },
];

const hostelSeeds = [
  {
    code: "BH-01",
    name: "Boys Hostel 1",
    type: HostelType.BOYS,
    capacity: 240,
    address: "North residential zone",
    blocks: ["A", "B"],
  },
  {
    code: "GH-01",
    name: "Girls Hostel 1",
    type: HostelType.GIRLS,
    capacity: 180,
    address: "East residential zone",
    blocks: ["A"],
  },
];

async function seedRoles() {
  for (const role of roleSeeds) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
  }
}

async function seedCampus() {
  return prisma.campus.upsert({
    where: { code: "MAIN-CAMPUS" },
    update: {
      name: "Main Campus",
      address: "Single campus residential complex",
    },
    create: {
      code: "MAIN-CAMPUS",
      name: "Main Campus",
      address: "Single campus residential complex",
    },
  });
}

async function seedHostelStructure(campusId) {
  for (const hostelSeed of hostelSeeds) {
    const hostel = await prisma.hostel.upsert({
      where: { code: hostelSeed.code },
      update: {
        campusId,
        name: hostelSeed.name,
        type: hostelSeed.type,
        capacity: hostelSeed.capacity,
        address: hostelSeed.address,
      },
      create: {
        campusId,
        code: hostelSeed.code,
        name: hostelSeed.name,
        type: hostelSeed.type,
        capacity: hostelSeed.capacity,
        address: hostelSeed.address,
      },
    });

    for (const blockCode of hostelSeed.blocks) {
      const block = await prisma.block.upsert({
        where: {
          hostelId_code: {
            hostelId: hostel.id,
            code: blockCode,
          },
        },
        update: {
          name: `Block ${blockCode}`,
        },
        create: {
          hostelId: hostel.id,
          code: blockCode,
          name: `Block ${blockCode}`,
        },
      });

      for (const floorNo of [1, 2]) {
        const floor = await prisma.floor.upsert({
          where: {
            blockId_floorNo: {
              blockId: block.id,
              floorNo,
            },
          },
          update: {},
          create: {
            blockId: block.id,
            floorNo,
          },
        });

        for (let roomIndex = 1; roomIndex <= 3; roomIndex += 1) {
          const roomNumber = `${floorNo}0${roomIndex}`;
          const room = await prisma.room.upsert({
            where: {
              floorId_roomNumber: {
                floorId: floor.id,
                roomNumber,
              },
            },
            update: {
              roomType: "DOUBLE",
              capacity: 2,
            },
            create: {
              floorId: floor.id,
              roomNumber,
              roomType: "DOUBLE",
              capacity: 2,
            },
          });

          for (const bedNumber of ["A", "B"]) {
            await prisma.bed.upsert({
              where: {
                roomId_bedNumber: {
                  roomId: room.id,
                  bedNumber,
                },
              },
              update: {},
              create: {
                roomId: room.id,
                bedNumber,
              },
            });
          }
        }
      }
    }
  }
}

async function seedFeeStructures() {
  const hostels = await prisma.hostel.findMany({
    select: { id: true, type: true },
  });

  for (const hostel of hostels) {
    const feeRows = [
      {
        hostelId: hostel.id,
        roomType: null,
        academicYear: "2026-27",
        frequency: "SEMESTER",
        category: "HOSTEL_FEE",
        amount: "35000.00",
      },
      {
        hostelId: hostel.id,
        roomType: null,
        academicYear: "2026-27",
        frequency: "ONE_TIME",
        category: "SECURITY_DEPOSIT",
        amount: "5000.00",
      },
    ];

    for (const feeRow of feeRows) {
      const existing = await prisma.feeStructure.findFirst({
        where: {
          hostelId: feeRow.hostelId,
          roomType: feeRow.roomType,
          academicYear: feeRow.academicYear,
          frequency: feeRow.frequency,
          category: feeRow.category,
        },
      });

      if (!existing) {
        await prisma.feeStructure.create({
          data: feeRow,
        });
      }
    }
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "System Administrator",
      passwordHash,
      status: UserStatus.ACTIVE,
    },
    create: {
      fullName: "System Administrator",
      email: adminEmail,
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const adminRole = await prisma.role.findUnique({
    where: { code: "ADMIN" },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }
}

async function main() {
  await seedRoles();
  const campus = await seedCampus();
  await seedHostelStructure(campus.id);
  await seedFeeStructures();
  await seedAdminUser();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
