import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.platformSetting.findMany();
    
    // Reduce array to a dictionary
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async updateSettings(settings: Record<string, any>, userId?: string) {
    const entries = Object.entries(settings);
    
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.platformSetting.upsert({
          where: { key },
          update: { value, updatedBy: userId },
          create: { key, value, updatedBy: userId },
        })
      )
    );

    return this.getSettings();
  }
}
