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
import { extname } from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const avatarBucketName = process.env.SUPABASE_AVATAR_BUCKET || 'pfp';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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

  @UseInterceptors(FileInterceptor('avatar'))
  @Patch(':id')
  async update(
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
      updatePayload.profileImage = await this.uploadAvatarToSupabase(file);
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

  private async uploadAvatarToSupabase(file: any): Promise<string> {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).',
      );
    }

    const fileExtension = extname(file.originalname || '').toLowerCase() || '.png';
    const uniqueFileName = `avatars/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${fileExtension}`;

    const { error } = await supabase.storage
      .from(avatarBucketName)
      .upload(uniqueFileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(avatarBucketName).getPublicUrl(uniqueFileName);

    if (!data?.publicUrl) {
      throw new Error('Supabase did not return a public URL for the uploaded avatar.');
    }

    return data.publicUrl;
  }
}
