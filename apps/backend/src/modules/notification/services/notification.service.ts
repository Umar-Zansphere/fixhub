import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { Queue } from 'bullmq';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { RedisService } from '../../../common/redis/redis.service';
import {
  NotificationChannel,
  NotificationPreferencesDto,
  NotificationTemplateDto,
  SendNotificationDto,
} from '../dto';
import { NotificationRepository } from '../repositories/notification.repository';
import {
  EmailNotificationChannel,
  PushNotificationChannel,
  SmsNotificationChannel,
} from './notification-channel.service';

const DEFAULT_PREFERENCES = {
  push: true,
  sms: true,
  email: true,
  mutedTypes: [] as NotificationType[],
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly redisService: RedisService,
    private readonly pushChannel: PushNotificationChannel,
    private readonly smsChannel: SmsNotificationChannel,
    private readonly emailChannel: EmailNotificationChannel,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SMS) private readonly smsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SCHEDULED_JOBS) private readonly deadLetterQueue: Queue,
  ) {}

  async listByUser(userId: string, pagination: PaginationDto) {
    return this.notificationRepository.findByUser(userId, pagination);
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async send(dto: SendNotificationDto) {
    const rendered = await this.render(dto);
    const preferences = await this.getPreferences(dto.userId);
    const type = dto.type ?? NotificationType.SYSTEM;

    if (preferences.mutedTypes.includes(type)) {
      return { queued: false, reason: 'TYPE_MUTED' };
    }

    const channels = (dto.channels ?? [NotificationChannel.PUSH]).filter((channel) =>
      this.preferenceAllows(channel, preferences),
    );

    const notification = await this.notificationRepository.create({
      userId: dto.userId,
      title: rendered.title,
      body: rendered.body,
      type,
      data: this.toJson({
        payload: dto.payload ?? {},
        channels,
        templateKey: dto.templateKey,
        deliveryLogs: [],
      }),
    });

    await Promise.all(
      channels.map((channel) => this.enqueueChannel(channel, { notificationId: notification.id })),
    );

    return { queued: true, notificationId: notification.id, channels };
  }

  async sendPushNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    payload?: Record<string, unknown>;
  }) {
    return this.send({
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type as NotificationType,
      payload: data.payload,
      channels: [NotificationChannel.PUSH],
    });
  }

  async processChannel(channel: NotificationChannel, notificationId: string) {
    const notification = await this.findNotification(notificationId);
    const profile = await this.notificationRepository.findUserDeliveryProfile(notification.userId);

    if (!profile) {
      throw new NotFoundException('Notification user not found');
    }

    const payload =
      notification.data && typeof notification.data === 'object' && !Array.isArray(notification.data)
        ? ((notification.data as Record<string, unknown>).payload as Record<string, unknown> | undefined)
        : undefined;
    const result =
      channel === NotificationChannel.PUSH
        ? await this.pushChannel.send({
            tokens: profile.deviceTokens.map((token) => token.token),
            title: notification.title,
            body: notification.body,
            data: payload,
          })
        : channel === NotificationChannel.SMS
          ? await this.smsChannel.send({ phone: profile.phone, body: notification.body })
          : await this.emailChannel.send({
              email: profile.email,
              subject: notification.title,
              body: notification.body,
            });

    await this.notificationRepository.appendDeliveryLog(notification.id, {
      channel,
      status: result.status,
      providerMessageId: result.providerMessageId,
      error: result.reason,
      attemptedAt: new Date().toISOString(),
    });

    return result;
  }

  async moveToDeadLetter(job: { id?: string | number; name: string; data: unknown; failedReason?: string }) {
    await this.deadLetterQueue.add(
      'notification-dead-letter',
      {
        originalJobId: job.id,
        originalJobName: job.name,
        originalData: job.data,
        failedReason: job.failedReason,
      },
      { removeOnComplete: 1000 },
    );
  }

  async getPreferences(userId: string) {
    const value = await this.redisService.get(this.preferencesKey(userId));
    return value ? { ...DEFAULT_PREFERENCES, ...JSON.parse(value) } : DEFAULT_PREFERENCES;
  }

  async updatePreferences(userId: string, dto: NotificationPreferencesDto) {
    const current = await this.getPreferences(userId);
    const next = { ...current, ...dto };
    await this.redisService.set(this.preferencesKey(userId), JSON.stringify(next));
    return next;
  }

  async upsertTemplate(template: NotificationTemplateDto) {
    await this.redisService.set(this.templateKey(template.key), JSON.stringify(template));
    return template;
  }

  async getTemplate(key: string) {
    const value = await this.redisService.get(this.templateKey(key));
    return value ? (JSON.parse(value) as NotificationTemplateDto) : null;
  }

  private async render(dto: SendNotificationDto) {
    if (!dto.templateKey) {
      return {
        title: dto.title ?? 'FixHub',
        body: dto.body ?? '',
      };
    }

    const template = await this.getTemplate(dto.templateKey);

    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    return {
      title: this.applyVariables(template.title, dto.variables),
      body: this.applyVariables(template.body, dto.variables),
    };
  }

  private async enqueueChannel(channel: NotificationChannel, data: { notificationId: string }) {
    const queue =
      channel === NotificationChannel.PUSH
        ? this.notificationQueue
        : channel === NotificationChannel.SMS
          ? this.smsQueue
          : this.emailQueue;

    await queue.add(channel.toLowerCase(), { channel, ...data }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: false,
    });
    this.logger.log(`Queued ${channel} notification ${data.notificationId}`);
  }

  private preferenceAllows(channel: NotificationChannel, preferences: typeof DEFAULT_PREFERENCES) {
    return (
      (channel === NotificationChannel.PUSH && preferences.push) ||
      (channel === NotificationChannel.SMS && preferences.sms) ||
      (channel === NotificationChannel.EMAIL && preferences.email)
    );
  }

  private applyVariables(template: string, variables?: Record<string, string | number | boolean>) {
    return Object.entries(variables ?? {}).reduce(
      (message, [key, value]) => message.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template,
    );
  }

  private async findNotification(notificationId: string) {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  private preferencesKey(userId: string) {
    return `notification:preferences:${userId}`;
  }

  private templateKey(key: string) {
    return `notification:template:${key}`;
  }

  private toJson(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
