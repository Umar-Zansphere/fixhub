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

  // TODO: Implement profile update, address CRUD
}
