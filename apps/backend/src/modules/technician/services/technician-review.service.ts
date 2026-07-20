import { Injectable } from '@nestjs/common';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TechnicianReviewRepository } from '../repositories/technician-review.repository';
import { TechnicianService } from './technician.service';

@Injectable()
export class TechnicianReviewService {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly reviewRepository: TechnicianReviewRepository,
  ) {}

  async listReviews(userId: string, pagination: PaginationDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.reviewRepository.listReviews(technicianId, pagination);
  }

  async getRatingsSummary(userId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.reviewRepository.getRatingsSummary(technicianId);
  }
}
