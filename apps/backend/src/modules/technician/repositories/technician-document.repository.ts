import { Injectable } from '@nestjs/common';
import { DocumentType } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class TechnicianDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTechnicianId(technicianId: string) {
    return this.prisma.technicianDocument.findMany({
      where: { technicianId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(documentId: string) {
    return this.prisma.technicianDocument.findUnique({
      where: { id: documentId },
    });
  }

  async create(technicianId: string, data: {
    documentType: DocumentType;
    url: string;
    s3Key: string;
  }) {
    return this.prisma.technicianDocument.create({
      data: {
        technicianId,
        documentType: data.documentType,
        url: data.url,
        s3Key: data.s3Key,
      },
    });
  }

  async delete(documentId: string) {
    return this.prisma.technicianDocument.delete({
      where: { id: documentId },
    });
  }
}
