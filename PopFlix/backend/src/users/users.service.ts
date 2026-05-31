import { NotificationService } from 'src/notification/notification.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { MembershipTier } from '../enum/MembershipTier';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'node:crypto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'This email is already registered. Please log in to continue.',
      );
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );
    const userData: any = { ...createUserDto };
    delete userData.confirmPassword;
    delete userData.favouriteGenres;
    delete userData.location;
    delete userData.gender;
    delete userData.bio;
    delete userData.profileImage;
    const activationToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    const newUser = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      isVerified: false,
      activationToken,
      activationTokenExpiry: expiry,
    } as Partial<User>);
    await this.usersRepository.save(newUser);

    await this.sendActivationEmail(
      newUser.email,
      newUser.firstName,
      activationToken,
    );

    return newUser;
  }

  async findOneById(id: number): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['reviews', 'ticketDesigns'],
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      points: user.loyaltyPoints,
      tier: user.membershipTier,
      totalSpent: user.totalSpent,
      location: user.location,
      gender: user.gender,
      bio: user.bio,
      favouriteGenres: user.favouriteGenres,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      ticketCount: user.ticketDesigns ? user.ticketDesigns.length : 0,
      reviewCount: user.reviews ? user.reviews.length : 0,
      created: user.createdAt,
    };
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName'],
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async addPoints(userId: number, points: number) {
    return this.usersRepository.increment(
      { id: userId },
      'loyaltyPoints',
      points,
    );
  }
  async updateTotalSpent(userId: number, amount: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      return;
    }
    const oldTier = user.membershipTier;
    const newTotal = Number(user.totalSpent) + Number(amount);
    let newTier = user.membershipTier;

    if (newTotal >= 2000) newTier = MembershipTier.GOLD;
    else if (newTotal >= 500) newTier = MembershipTier.SILVER;

    await this.usersRepository.update(userId, {
      totalSpent: newTotal,
      membershipTier: newTier,
    });

    if (oldTier !== newTier) {
      try {
        await this.notificationService.createNotification(
          userId,
          'Tier Upgraded!',
          `Congratulations! You have been upgraded to the ${newTier} Tier. Check out your exclusive new reward perks!`,
          'success',
          '/profile?tab=Membership+Rewards',
        );
      } catch (notifError) {
        console.error('Failed to send tier upgrade notification:', notifError);
      }
    }
    return { totalSpent: newTotal, membershipTier: newTier };
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async update(id: number, updateUserDto: any) {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOneById(id);
  }

  async remove(id: number) {
    return this.usersRepository.delete(id);
  }

  async sendWelcomeEmail(email: string, name: string) {
    return await this.emailService.sendMail({
      to: email,
      subject: 'Welcome to PopFlix! 🍿',
      template: './welcome',
      context: { name },
    });
  }

  async sendActivationEmail(email: string, name: string, token: string) {
    const activationUrl = `http://localhost:5173/activate?token=${token}`;
    return await this.emailService.sendMail({
      to: email,
      subject: 'Verify your PopFlix account',
      template: './activation',
      context: {
        name: name,
        url: activationUrl,
      },
    });
  }
}
