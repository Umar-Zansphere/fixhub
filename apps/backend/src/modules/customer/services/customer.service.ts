import { ErrorCodes } from '@fixhub/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CustomerRepository } from '../repositories/customer.repository';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async getProfile(userId: string) {
    const customer = await this.customerRepository.findByUserId(userId);

    if (!customer) {
      throw new NotFoundException({
        message: 'Customer not found',
        errorCode: ErrorCodes.USER_NOT_FOUND,
      });
    }

    return customer;
  }

  async updateProfile(userId: string, data: any) {
    return this.customerRepository.updateProfile(userId, data);
  }

  async getAddresses(userId: string) {
    return this.customerRepository.getAddresses(userId);
  }

  async addAddress(userId: string, data: any) {
    return this.customerRepository.addAddress(userId, data);
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    return this.customerRepository.updateAddress(addressId, data);
  }

  async deleteAddress(userId: string, addressId: string) {
    return this.customerRepository.deleteAddress(addressId);
  }
}
