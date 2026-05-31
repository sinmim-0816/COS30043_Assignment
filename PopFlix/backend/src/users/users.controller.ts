import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

const avatarUploadRoot = join(process.cwd(), 'public', 'pfp');

const avatarStorage = diskStorage({
  destination: (req, file, cb) => {
    mkdirSync(avatarUploadRoot, { recursive: true });
    cb(null, avatarUploadRoot);
  },
  filename: (req, file, cb) => {
    const safeBaseName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeBaseName || 'avatar'}${extname(file.originalname)}`);
  },
});

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: any,
  ) {
    const updatePayload: any = updateUserDto;

    if (updatePayload.favouriteGenres && typeof updatePayload.favouriteGenres === 'string') {
      const genresValue = updatePayload.favouriteGenres;

      try {
        const parsedGenres = JSON.parse(genresValue);
        updatePayload.favouriteGenres = Array.isArray(parsedGenres)
          ? parsedGenres
          : genresValue
              .split(',')
              .map((genre) => genre.trim())
              .filter(Boolean);
      } catch {
        updatePayload.favouriteGenres = genresValue
          .split(',')
          .map((genre) => genre.trim())
          .filter(Boolean);
      }
    }

    if (file) {
      updatePayload.profileImage = `/public/pfp/${file.filename}`;
    }

    return this.usersService.update(+id, updatePayload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post('test-email')
  async testEmail(@Body('email') email: string) {
    return await this.usersService.sendWelcomeEmail(email, 'Test User');
  }

  @Post('test-activation')
  async testActivation(
    @Body('email') email: string,
    @Body('name') name: string,
  ) {
    const dummyToken = 'test-token-123-abc-456';

    return await this.usersService.sendActivationEmail(email, name, dummyToken);
  }
}
