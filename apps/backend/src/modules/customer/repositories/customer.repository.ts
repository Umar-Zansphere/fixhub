import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.customer.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, phone: true, name: true, email: true, role: true } },
        addresses: true,
      },
    });
  }

  // TODO: Implement create, update, address CRUD methods
}
