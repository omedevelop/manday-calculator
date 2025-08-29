import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getProjects() {
  return await prisma.project.findMany({
    include: {
      people: {
        include: {
          teamMember: true,
          role: true,
        },
      },
      holidays: true,
      summary: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      people: {
        include: {
          teamMember: true,
          role: true,
        },
      },
      holidays: true,
      summary: true,
    },
  });
}

export async function getRateCard() {
  return await prisma.rateCardRole.findMany({
    include: {
      tiers: {
        where: { active: true },
        orderBy: { level: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getTeamMembers() {
  return await prisma.teamMember.findMany({
    include: {
      role: true,
    },
    where: {
      status: 'ACTIVE',
    },
    orderBy: { name: 'asc' },
  });
}

export async function getProjectSummary(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      people: true,
      summary: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return project;
}
