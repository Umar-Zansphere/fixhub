import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.AADHAAR })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ example: 'aadhaar-front.jpg' })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType!: string;

  @ApiPropertyOptional({ example: 'https://cdn.fixhub.in/documents/aadhaar.jpg', description: 'If provided, document is persisted immediately without presigned upload' })
  @IsOptional()
  @IsUrl()
  url?: string;
}
