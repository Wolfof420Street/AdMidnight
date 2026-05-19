import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type AdvertiserRow = {
  id: string;
  role: string;
  status: string;
  displayName: string | null;
};

@Injectable()
export class AdvertiserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureAdvertiser(id: string, displayName?: string): Promise<void> {
    const now = new Date();
    await this.prisma.advertiser.upsert({
      where: { id },
      create: {
        id,
        role: 'advertiser',
        status: 'ACTIVE',
        displayName: displayName ?? null,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        displayName: displayName ?? undefined,
        updatedAt: now,
      },
    });
  }

  async findActiveAdvertiser(id: string): Promise<AdvertiserRow | null> {
    const row = await this.prisma.advertiser.findFirst({
      where: { id, status: 'ACTIVE' },
      select: { id: true, role: true, status: true, displayName: true },
    });

    return (row as unknown as AdvertiserRow) ?? null;
  }
}
