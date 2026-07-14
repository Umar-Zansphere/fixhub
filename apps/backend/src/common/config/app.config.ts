import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AppConfig {
  @IsString()
  NODE_ENV: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  APP_PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_HOST: string;

  @IsInt()
  @Type(() => Number)
  REDIS_PORT: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRATION: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_REFRESH_EXPIRATION: string;

  @IsString()
  AWS_REGION: string;

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  AWS_S3_BUCKET: string;

  @IsOptional()
  @IsString()
  RAZORPAY_KEY_ID?: string;

  @IsOptional()
  @IsString()
  RAZORPAY_KEY_SECRET?: string;

  @IsOptional()
  @IsString()
  RAZORPAY_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  FIREBASE_PROJECT_ID?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsInt()
  @Type(() => Number)
  THROTTLE_TTL: number;

  @IsInt()
  @Type(() => Number)
  THROTTLE_LIMIT: number;
}

export const appConfig = () => ({
  port: parseInt(process.env.APP_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  otp: {
    expirationSeconds: parseInt(process.env.OTP_EXPIRATION_SECONDS || '300', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },

  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET || 'fixhub-uploads',
    signedUrlExpiry: parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRY || '3600', 10),
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(','),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});

export type AppConfigValues = ReturnType<typeof appConfig>;
