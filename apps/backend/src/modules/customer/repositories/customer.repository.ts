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

  async updateProfile(userId: string, data: any) {
    const { name, email, profilePictureUrl } = data;
    
    return this.prisma.$transaction(async (tx) => {
      // Update User details
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: name,
          email: email,
        },
      });

      // Update Customer details
      let customer = await tx.customer.findUnique({ where: { userId } });
      if (customer) {
        customer = await tx.customer.update({
          where: { userId },
          data: {
            profilePictureUrl,
          },
        });
      }
      return this.findByUserId(userId);
    });
  }

  async getAddresses(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) return [];

    return this.prisma.address.findMany({
      where: { customerId: customer.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addAddress(userId: string, data: any) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer not found');

    return this.prisma.address.create({
      data: {
        customer: { connect: { id: customer.id } },
        label: data.label,
        line1: data.line1 ?? data.line_1,
        line2: data.line2 ?? data.line_2,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pincode: data.pincode ?? data.postalCode,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        isDefault: data.isDefault ?? data.is_default ?? false,
      },
    });
  }

  async updateAddress(addressId: string, data: any) {
    const updateData: any = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.line1 !== undefined || data.line_1 !== undefined) updateData.line1 = data.line1 ?? data.line_1;
    if (data.line2 !== undefined || data.line_2 !== undefined) updateData.line2 = data.line2 ?? data.line_2;
    if (data.landmark !== undefined) updateData.landmark = data.landmark;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined || data.postalCode !== undefined) updateData.pincode = data.pincode ?? data.postalCode;
    if (data.latitude !== undefined && data.latitude !== null) updateData.latitude = data.latitude;
    if (data.longitude !== undefined && data.longitude !== null) updateData.longitude = data.longitude;
    if (data.isDefault !== undefined || data.is_default !== undefined) updateData.isDefault = data.isDefault ?? data.is_default;

    return this.prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });
  }

  async deleteAddress(addressId: string) {
    return this.prisma.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });
  }
}
