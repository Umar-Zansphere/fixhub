import { ErrorCodes } from '@fixhub/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';

import { CustomerQueryDto, TechnicianQueryDto } from '../dto/admin.dto';
import { AdminRepository } from '../repositories/admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getDashboardStats() {
    return this.adminRepository.getDashboardStats();
  }

  async listCustomers(query: CustomerQueryDto) {
    return this.adminRepository.listCustomers(query);
  }

  async getCustomerDetails(id: string) {
    const customer = await this.adminRepository.getCustomerDetails(id);
    if (!customer) {
      throw new NotFoundException({
        message: 'Customer not found',
        errorCode: ErrorCodes.CUSTOMER_NOT_FOUND,
      });
    }
    return customer;
  }

  async listTechnicians(query: TechnicianQueryDto) {
    return this.adminRepository.listTechnicians(query);
  }

  async getTechnicianDetails(id: string) {
    const technician = await this.adminRepository.getTechnicianDetails(id);
    if (!technician) {
      throw new NotFoundException({
        message: 'Technician not found',
        errorCode: ErrorCodes.TECHNICIAN_NOT_FOUND,
      });
    }
    return technician;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    try {
      return await this.adminRepository.updateUserStatus(userId, isActive);
    } catch (e: any) {
      // Prisma error for record not found
      if (e.code === 'P2025') {
        throw new NotFoundException({
          message: 'User not found',
          errorCode: ErrorCodes.USER_NOT_FOUND,
        });
      }
      throw e;
    }
  }

  async verifyTechnician(id: string, status: VerificationStatus, rejectionNote?: string) {
    try {
      return await this.adminRepository.verifyTechnician(id, status, rejectionNote);
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new NotFoundException({
          message: 'Technician not found',
          errorCode: ErrorCodes.TECHNICIAN_NOT_FOUND,
        });
      }
      throw e;
    }
  }
}
