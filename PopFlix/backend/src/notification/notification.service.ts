// src/notification/notification.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type = 'info',
    url?: string,
  ) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
      type,
      url,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.sendNotificationToClient(
      String(userId),
      savedNotification,
    );

    return savedNotification;
  }

  async findAllByUser(userId: number, search?: string) {
    if (search) {
      return await this.notificationRepository.find({
        where: [
          { userId, title: ILike(`%${search}%`) },
          { userId, message: ILike(`%${search}%`) },
        ],
        order: { createdAt: 'DESC' },
      });
    }

    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async remove(id: number) {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await this.notificationRepository.delete(id);
    return {
      success: true,
      message: `Notification with ID ${id} successfully deleted`,
    };
  }
}
