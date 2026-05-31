import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { Request as ExpressRequest } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
    email: string;
  };
}
// POST: /auth/login
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const fullUser = await this.usersService.findOneById(req.user.userId);

    if (!fullUser) {
      throw new BadRequestException('User profile not found');
    }

    return fullUser;
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.usersService.create(createUserDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return await this.authService.forgotPassword(email);
  }

  @Post('test-reset-email')
  async testResetEmail(@Body('email') email: string) {
    return await this.authService.sendResetEmail(email, 'Tester', '12345');
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetDto: { token: string; newPassword: string },
  ) {
    return await this.authService.resetPassword(
      resetDto.token,
      resetDto.newPassword,
    );
  }

  @Get('verify-reset-token/:token')
  async verifyResetToken(@Param('token') token: string) {
    return await this.authService.verifyResetToken(token);
  }

  @Post('activate/:token')
  async activate(@Param('token') token: string) {
    return this.authService.activateAccount(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
