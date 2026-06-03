import { NotificationService } from './../notification/notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    if (user.isVerified === false) {
      throw new UnauthorizedException(
        'Account not verified. Please check your email to activate your account.',
      );
    }
    const payload = { sub: user.id, email: user.email };
    const profile = await this.usersService.findOneById(user.id);

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: profile,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('If an account exists, a reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    await this.userRepository.save(user);

    await this.emailService.sendMail({
      to: email,
      subject: 'Reset your PopFlix password',
      template: './reset-password',
      context: {
        name: user.firstName,
        url: `https://popflix-frontend.onrender.com/reset-password?token=${resetToken}`,
      },
    });
  }

  async sendResetEmail(email: string, name: string, token: string) {
    const resetUrl = `https://popflix-frontend.onrender.com/reset-password?token=${token}`;

    return await this.emailService.sendMail({
      to: email,
      subject: 'Reset your PopFlix password',
      template: './reset-password',
      context: {
        name: name,
        url: resetUrl,
      },
    });
  }

  async verifyResetToken(token: string) {
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (!user) {
      throw new BadRequestException('This reset link is invalid.');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('This reset link has expired. Please request a new one.');
    }

    return { valid: true, email: user.email };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await this.userRepository.save(user);
    return { message: 'Password updated successfully' };
  }

  async activateAccount(token: string) {
    const user = await this.userRepository.findOne({
      where: { activationToken: token },
    });

    if (!user || !user.activationTokenExpiry || user.activationTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired activation link.');
    }

    user.isVerified = true;
    user.activationToken = null;
    user.activationTokenExpiry = null;
    const activatedUser = await this.userRepository.save(user);

    await this.usersService.sendWelcomeEmail(user.email, user.firstName);

    await this.notificationService.createNotification(
      activatedUser.id,
      'Welcome to PopFlix!',
      'Explore movies, book tickets, and enjoy premium cinema experiences.',
      'success',
      '/movies',
    );

    return { message: 'Account activated successfully.' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!currentPassword) {
      throw new BadRequestException('Current password is required');
    }

    if (!user.password) {
      throw new BadRequestException('User password not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }
}
