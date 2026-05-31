import { NotificationService } from 'src/notification/notification.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketDesign } from './entities/ticket-design.entity';
import { CreateTicketDesignDto } from './dto/create-ticket-design.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class TicketDesignService {
  constructor(
    @InjectRepository(TicketDesign)
    private readonly ticketDesignRepository: Repository<TicketDesign>,
    private readonly notificationService: NotificationService,
  ) {}

  private async persistDesignImage(designImage: string, bookingId: string) {
    if (!designImage) {
      throw new Error('design_image is required');
    }

    if (!designImage.startsWith('data:image/')) {
      return designImage;
    }

    const match = designImage.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
    );
    if (!match) {
      throw new Error('Invalid design image data URL');
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
    const safeBookingId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeBookingId}_${Date.now()}.${extension}`;
    const relativePath = path.posix.join('/public', 'ticket-designs', fileName);
    const outputDir = path.join(process.cwd(), 'public', 'ticket-designs');
    const outputPath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(base64Data, 'base64'));

    return relativePath;
  }

  async createNewDesign(userId: number, dto: CreateTicketDesignDto) {
    const savedImagePath = await this.persistDesignImage(
      dto.design_image,
      dto.booking_id,
    );
    const newDesign = this.ticketDesignRepository.create({
      ...dto,
      design_image: savedImagePath,
      user_id: userId,
    });

    const savedDesign = await this.ticketDesignRepository.save(newDesign);
    try {
      await this.notificationService.createNotification(
        userId,
        'Ticket Design Saved!',
        `Your personalized ticket styling has been successfully created. Ready for sharing!`,
        'success',
        '/profile?tab=Ticket+Design',
      );
    } catch (notifError) {
      console.error(
        'Failed to dispatch ticket design notification:',
        notifError,
      );
    }
    return savedDesign;
  }

  async findAllByBookingId(bookingId: string) {
    return await this.ticketDesignRepository.find({
      where: { booking_id: bookingId },
      relations: ['booking', 'booking.showtime', 'booking.showtime.movie'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllByUserId(userId: number) {
    return await this.ticketDesignRepository.find({
      where: { user_id: userId },
      relations: ['booking', 'booking.showtime', 'booking.showtime.movie'],
      order: { created_at: 'DESC' },
    });
  }
}
