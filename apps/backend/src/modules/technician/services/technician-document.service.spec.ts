import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentType } from '@prisma/client';

import { StorageService } from '../../../common/storage/storage.service';
import { TechnicianDocumentRepository } from '../repositories/technician-document.repository';
import { TechnicianService } from './technician.service';
import { TechnicianDocumentService } from './technician-document.service';

describe('TechnicianDocumentService', () => {
  let service: TechnicianDocumentService;
  let technicianService: jest.Mocked<TechnicianService>;
  let documentRepository: jest.Mocked<TechnicianDocumentRepository>;
  let storageService: jest.Mocked<StorageService>;

  const userId = 'user-uuid-1';
  const technicianId = 'tech-uuid-1';
  const documentId = 'doc-uuid-1';

  const document = {
    id: documentId,
    technicianId,
    documentType: DocumentType.AADHAAR,
    url: 'https://cdn.fixhub.in/documents/aadhaar.jpg',
    s3Key: 'technicians/tech-uuid-1/documents/aadhaar.jpg',
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    rejectionNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicianDocumentService,
        {
          provide: TechnicianService,
          useValue: {
            resolveTechnicianId: jest.fn(),
          },
        },
        {
          provide: TechnicianDocumentRepository,
          useValue: {
            findByTechnicianId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            generateKey: jest.fn(),
            getUploadUrl: jest.fn(),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TechnicianDocumentService);
    technicianService = module.get(TechnicianService);
    documentRepository = module.get(TechnicianDocumentRepository);
    storageService = module.get(StorageService);

    technicianService.resolveTechnicianId.mockResolvedValue(technicianId);
  });

  describe('listDocuments', () => {
    it('returns documents for the technician', async () => {
      documentRepository.findByTechnicianId.mockResolvedValue([document] as any);

      const result = await service.listDocuments(userId);

      expect(result).toHaveLength(1);
      expect(result[0].documentType).toBe(DocumentType.AADHAAR);
    });
  });

  describe('uploadDocument', () => {
    it('creates a document with presigned upload URL', async () => {
      storageService.generateKey.mockReturnValue('technicians/tech-uuid-1/documents/12345-abc.jpg');
      storageService.getUploadUrl.mockResolvedValue('https://s3.presigned-url.com/upload');
      documentRepository.create.mockResolvedValue(document as any);

      const result = await service.uploadDocument(userId, {
        documentType: DocumentType.AADHAAR,
        fileName: 'aadhaar.jpg',
        contentType: 'image/jpeg',
      });

      expect(result.uploadUrl).toBe('https://s3.presigned-url.com/upload');
      expect(result.document.id).toBe(documentId);
      expect(storageService.generateKey).toHaveBeenCalledWith(
        `technicians/${technicianId}/documents`,
        'aadhaar.jpg',
      );
    });
  });

  describe('deleteDocument', () => {
    it('deletes a document owned by the technician', async () => {
      documentRepository.findById.mockResolvedValue(document as any);
      documentRepository.delete.mockResolvedValue(document as any);

      const result = await service.deleteDocument(userId, documentId);

      expect(result.deleted).toBe(true);
      expect(storageService.deleteObject).toHaveBeenCalledWith(document.s3Key);
      expect(documentRepository.delete).toHaveBeenCalledWith(documentId);
    });

    it('throws NotFoundException when document does not exist', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(service.deleteDocument(userId, documentId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when document belongs to another technician', async () => {
      documentRepository.findById.mockResolvedValue({
        ...document,
        technicianId: 'other-tech-uuid',
      } as any);

      await expect(service.deleteDocument(userId, documentId)).rejects.toThrow(ForbiddenException);
    });
  });
});
