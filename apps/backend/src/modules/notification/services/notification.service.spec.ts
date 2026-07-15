import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationType } from '@prisma/client';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { RedisService } from '../../../common/redis/redis.service';
import { NotificationChannel } from '../dto';
import { NotificationRepository } from '../repositories/notification.repository';
import {
  EmailNotificationChannel,
  PushNotificationChannel,
  SmsNotificationChannel,
} from './notification-channel.service';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: jest.Mocked<NotificationRepository>;
  let redisService: jest.Mocked<RedisService>;
  let pushChannel: jest.Mocked<PushNotificationChannel>;
  let smsChannel: jest.Mocked<SmsNotificationChannel>;
  let emailChannel: jest.Mocked<EmailNotificationChannel>;
  let notificationQueue: { add: jest.Mock };
  let smsQueue: { add: jest.Mock };
  let emailQueue: { add: jest.Mock };
  let deadLetterQueue: { add: jest.Mock };

  const notification = {
    id: 'notification-uuid-1',
    userId: 'user-uuid-1',
    title: 'Hello',
    body: 'Body',
    type: NotificationType.SYSTEM,
    data: { payload: { screen: 'home' }, deliveryLogs: [] },
  };

  beforeEach(async () => {
    notificationQueue = { add: jest.fn() };
    smsQueue = { add: jest.fn() };
    emailQueue = { add: jest.fn() };
    deadLetterQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: {
            findByUser: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findUserDeliveryProfile: jest.fn(),
            appendDeliveryLog: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: PushNotificationChannel,
          useValue: { send: jest.fn() },
        },
        {
          provide: SmsNotificationChannel,
          useValue: { send: jest.fn() },
        },
        {
          provide: EmailNotificationChannel,
          useValue: { send: jest.fn() },
        },
        { provide: getQueueToken(QUEUE_NAMES.NOTIFICATION), useValue: notificationQueue },
        { provide: getQueueToken(QUEUE_NAMES.SMS), useValue: smsQueue },
        { provide: getQueueToken(QUEUE_NAMES.EMAIL), useValue: emailQueue },
        { provide: getQueueToken(QUEUE_NAMES.SCHEDULED_JOBS), useValue: deadLetterQueue },
      ],
    }).compile();

    service = module.get(NotificationService);
    repository = module.get(NotificationRepository);
    redisService = module.get(RedisService);
    pushChannel = module.get(PushNotificationChannel);
    smsChannel = module.get(SmsNotificationChannel);
    emailChannel = module.get(EmailNotificationChannel);

    repository.create.mockResolvedValue(notification as any);
  });

  it('queues enabled channels and creates an in-app notification', async () => {
    const result = await service.send({
      userId: 'user-uuid-1',
      title: 'Hello',
      body: 'Body',
      type: NotificationType.SYSTEM,
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL],
    });

    expect(result.queued).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-uuid-1',
        title: 'Hello',
        body: 'Body',
      }),
    );
    expect(notificationQueue.add).toHaveBeenCalledWith(
      'push',
      expect.objectContaining({ notificationId: notification.id }),
      expect.objectContaining({ attempts: 5 }),
    );
    expect(smsQueue.add).toHaveBeenCalled();
    expect(emailQueue.add).toHaveBeenCalled();
  });

  it('respects muted notification types', async () => {
    redisService.get.mockResolvedValue(
      JSON.stringify({ mutedTypes: [NotificationType.PROMOTIONAL] }),
    );

    const result = await service.send({
      userId: 'user-uuid-1',
      title: 'Sale',
      body: 'Offer',
      type: NotificationType.PROMOTIONAL,
    });

    expect(result).toEqual({ queued: false, reason: 'TYPE_MUTED' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('renders templates with variables', async () => {
    redisService.get.mockImplementation(async (key: string) =>
      key.includes('notification:template')
        ? JSON.stringify({
            key: 'booking.confirmed',
            title: 'Booking {{bookingNumber}}',
            body: 'Hi {{name}}',
          })
        : null,
    );

    await service.send({
      userId: 'user-uuid-1',
      templateKey: 'booking.confirmed',
      variables: { bookingNumber: 'FH-1', name: 'Ravi' },
      channels: [NotificationChannel.PUSH],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Booking FH-1',
        body: 'Hi Ravi',
      }),
    );
  });

  it('updates preferences in Redis', async () => {
    const result = await service.updatePreferences('user-uuid-1', { sms: false });

    expect(result.sms).toBe(false);
    expect(redisService.set).toHaveBeenCalledWith(
      'notification:preferences:user-uuid-1',
      expect.stringContaining('"sms":false'),
    );
  });

  it('stores templates in Redis', async () => {
    const template = {
      key: 'system.alert',
      title: 'Alert',
      body: 'Body',
    };

    await expect(service.upsertTemplate(template)).resolves.toEqual(template);
    expect(redisService.set).toHaveBeenCalledWith(
      'notification:template:system.alert',
      JSON.stringify(template),
    );
  });

  it('processes push channel and appends delivery log', async () => {
    repository.findById.mockResolvedValue(notification as any);
    repository.findUserDeliveryProfile.mockResolvedValue({
      id: 'user-uuid-1',
      phone: '+919876543210',
      email: 'user@example.com',
      deviceTokens: [{ token: 'fcm-token' }],
    } as any);
    pushChannel.send.mockResolvedValue({ status: 'SENT', providerMessageId: 'fcm:1' });

    const result = await service.processChannel(NotificationChannel.PUSH, notification.id);

    expect(result.status).toBe('SENT');
    expect(pushChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['fcm-token'],
        title: notification.title,
      }),
    );
    expect(repository.appendDeliveryLog).toHaveBeenCalledWith(
      notification.id,
      expect.objectContaining({
        channel: NotificationChannel.PUSH,
        status: 'SENT',
      }),
    );
  });

  it('processes SMS and email channels', async () => {
    repository.findById.mockResolvedValue(notification as any);
    repository.findUserDeliveryProfile.mockResolvedValue({
      id: 'user-uuid-1',
      phone: '+919876543210',
      email: 'user@example.com',
      deviceTokens: [],
    } as any);
    smsChannel.send.mockResolvedValue({ status: 'SENT', providerMessageId: 'sms:1' });
    emailChannel.send.mockResolvedValue({ status: 'SENT', providerMessageId: 'email:1' });

    await service.processChannel(NotificationChannel.SMS, notification.id);
    await service.processChannel(NotificationChannel.EMAIL, notification.id);

    expect(smsChannel.send).toHaveBeenCalledWith({
      phone: '+919876543210',
      body: notification.body,
    });
    expect(emailChannel.send).toHaveBeenCalledWith({
      email: 'user@example.com',
      subject: notification.title,
      body: notification.body,
    });
  });

  it('throws when processing missing notification', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.processChannel(NotificationChannel.PUSH, 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('moves failed jobs to dead letter queue', async () => {
    await service.moveToDeadLetter({
      id: 'job-1',
      name: 'push',
      data: { notificationId: notification.id },
      failedReason: 'Provider down',
    });

    expect(deadLetterQueue.add).toHaveBeenCalledWith(
      'notification-dead-letter',
      expect.objectContaining({
        originalJobId: 'job-1',
        failedReason: 'Provider down',
      }),
      expect.any(Object),
    );
  });
});
