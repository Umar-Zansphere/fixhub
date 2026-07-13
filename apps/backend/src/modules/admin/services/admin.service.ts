import { Injectable } from '@nestjs/common';

import { AdminRepository } from '../repositories/admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getDashboardStats() {
    return this.adminRepository.getDashboardStats();
  }

  // TODO: Implement technician management, category CRUD, service area CRUD,
  // booking management, pricing management
}
