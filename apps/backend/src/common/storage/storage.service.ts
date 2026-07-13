import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PresignedUrlOptions {
  key: string;
  contentType: string;
  expiresIn?: number;
}

export interface UploadResult {
  key: string;
  url: string;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly signedUrlExpiry: number;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region', 'ap-south-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId', ''),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey', ''),
      },
    });
    this.bucket = this.configService.get<string>('aws.s3Bucket', 'fixhub-uploads');
    this.signedUrlExpiry = this.configService.get<number>('aws.signedUrlExpiry', 3600);
  }

  /**
   * Generate a pre-signed URL for client-side upload
   */
  async getUploadUrl(options: PresignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      ContentType: options.contentType,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: options.expiresIn || this.signedUrlExpiry,
    });
  }

  /**
   * Generate a pre-signed URL for downloading/viewing
   */
  async getDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.signedUrlExpiry,
    });
  }

  /**
   * Delete an object from S3
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate a unique S3 key for a file
   */
  generateKey(folder: string, filename: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    return `${folder}/${timestamp}-${randomSuffix}.${extension}`;
  }
}
