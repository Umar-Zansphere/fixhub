import { Injectable } from '@nestjs/common';

import { EarningsQueryDto } from '../dto';
import { TechnicianEarningsRepository } from '../repositories/technician-earnings.repository';
import { TechnicianService } from './technician.service';

@Injectable()
export class TechnicianEarningsService {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly earningsRepository: TechnicianEarningsRepository,
  ) {}

  async getEarningsSummary(userId: string, query: EarningsQueryDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.earningsRepository.getEarningsSummary(technicianId, query.dateFrom, query.dateTo);
  }

  async listEarnings(userId: string, query: EarningsQueryDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.earningsRepository.listCompletedBookings(technicianId, query, query.dateFrom, query.dateTo);
  }
}
