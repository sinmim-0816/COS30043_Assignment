import { NotificationService } from 'src/notification/notification.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketDesign } from './entities/ticket-design.entity';
import { CreateTicketDesignDto } from './dto/create-ticket-design.dto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class TicketDesignService {
  private readonly supabase = (() => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseKey);
  })();

  private readonly ticketDesignBucket = process.env.SUPABASE_TICKET_BUCKET || 'ticket-designs';

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

    const match = designImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid design image data URL');
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
    if (!this.supabase) {
      throw new Error(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).',
      );
    }

    const safeBookingId = String(bookingId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `ticket-designs/${safeBookingId}_${Date.now()}.${extension}`;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const { error } = await this.supabase.storage
      .from(this.ticketDesignBucket)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage.from(this.ticketDesignBucket).getPublicUrl(fileName);

    if (!data?.publicUrl) {
      throw new Error('Supabase did not return a public URL for the uploaded ticket design.');
    }

    return data.publicUrl;
  }

  async createNewDesign(userId: number, dto: CreateTicketDesignDto) {
    const savedImagePath = await this.persistDesignImage(dto.design_image, dto.booking_id);
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
      console.error('Failed to dispatch ticket design notification:', notifError);
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
