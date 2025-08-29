import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Omelet rate card roles
  const developerRole = await prisma.rateCardRole.upsert({
    where: { name: 'Developer' },
    update: {},
    create: { name: 'Developer' },
  })

  const designerRole = await prisma.rateCardRole.upsert({
    where: { name: 'Designer' },
    update: {},
    create: { name: 'Designer' },
  })

  const projectManagerRole = await prisma.rateCardRole.upsert({
    where: { name: 'Project Manager' },
    update: {},
    create: { name: 'Project Manager' },
  })

  const qaRole = await prisma.rateCardRole.upsert({
    where: { name: 'QA Engineer' },
    update: {},
    create: { name: 'QA Engineer' },
  })

  // Create rate card tiers with Omelet THB/day defaults
  const roles = [developerRole, designerRole, projectManagerRole, qaRole]
  
  for (const role of roles) {
    // Team Lead tier
    await prisma.rateCardTier.upsert({
      where: {
        roleId_level: {
          roleId: role.id,
          level: 'TEAM_LEAD'
        }
      },
      update: {},
      create: {
        roleId: role.id,
        level: 'TEAM_LEAD',
        pricePerDay: 4500,
        active: true
      }
    })

    // Senior tier
    await prisma.rateCardTier.upsert({
      where: {
        roleId_level: {
          roleId: role.id,
          level: 'SENIOR'
        }
      },
      update: {},
      create: {
        roleId: role.id,
        level: 'SENIOR',
        pricePerDay: 3500,
        active: true
      }
    })

    // Junior tier
    await prisma.rateCardTier.upsert({
      where: {
        roleId_level: {
          roleId: role.id,
          level: 'JUNIOR'
        }
      },
      update: {},
      create: {
        roleId: role.id,
        level: 'JUNIOR',
        pricePerDay: 2500,
        active: true
      }
    })
  }

  // Create some sample team members (skip duplicates by name)
  await prisma.teamMember.createMany({
    data: [
      {
        name: 'John Developer',
        roleId: developerRole.id,
        level: 'SENIOR',
        defaultRatePerDay: 3500,
        notes: 'Full-stack developer with 5+ years experience',
        status: 'ACTIVE'
      },
      {
        name: 'Sarah Designer',
        roleId: designerRole.id,
        level: 'TEAM_LEAD',
        defaultRatePerDay: 4500,
        notes: 'UI/UX design lead',
        status: 'ACTIVE'
      },
      {
        name: 'Mike Manager',
        roleId: projectManagerRole.id,
        level: 'SENIOR',
        defaultRatePerDay: 3500,
        notes: 'Agile project manager',
        status: 'ACTIVE'
      }
    ],
    skipDuplicates: true
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
