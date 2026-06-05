import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GenerateTicketDesignDto } from './dto/generate-ticket-design.dto';

type AiTextElement = {
  type: 'title' | 'runtime' | 'genres' | 'cinema' | 'hall' | 'startTime' | 'seats' | 'qr' | 'barcode' | 'id';
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  color: string;
  rotation?: number;
  fontFamily?: string;
};

type AiTicketDesign = {
  colorMode: 'solid' | 'gradient';
  accentColor: string;
  accentColor2: string;
  gradientAngle: number;
  backdropOpacity: number;
  backgroundIndex: number;
  textElements: AiTextElement[];
  description?: string;
};

@Injectable()
export class AiDesignService {
  constructor(private readonly configService: ConfigService) {}

  async generateTicketDesign(dto: GenerateTicketDesignDto): Promise<AiTicketDesign> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const fallback = this.createFallbackDesign(dto);

    if (!apiKey) {
      return fallback;
    }

    try {
      const model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        this.buildGeminiRequest(dto),
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          timeout: 20000,
        },
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return fallback;
      }

      return this.sanitizeDesign(JSON.parse(text), dto, fallback);
    } catch (error) {
      console.error('Gemini ticket design failed:', error);
      if (this.configService.get<string>('AI_DESIGN_STRICT') === 'true') {
        throw new InternalServerErrorException('AI ticket design failed');
      }
      return fallback;
    }
  }

  private buildGeminiRequest(dto: GenerateTicketDesignDto) {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Design a premium cinema ticket using only this JSON schema.',
                'Return JSON only. No markdown. No explanation.',
                'Coordinates are CSS pixels inside the ticket canvas.',
                `Canvas size: ${dto.canvasWidth || 650} x ${dto.canvasHeight || 430}.`,
                'The visible ticket is not a full rectangle. Avoid the left stub/cutout area and all extreme edges.',
                'Use this safe layout zone for normal text: x 185 to 560, y 72 to 330. Do not put text above y 72.',
                'Use this safe layout zone for QR/barcode: x 470 to 560, y 72 to 235, with width and height between 72 and 92.',
                'Keep text readable, balanced, inside the ticket, and never overlap elements.',
                'Use exactly 4 to 6 textElements. Include title, seats, startTime, cinema, and one qr or barcode.',
                'Use one of these fontFamily values: Inter, Playfair Display, Bebas Neue, Montserrat, Courier Prime, Roboto, Oswald, Lora, Pacifico.',
                `User design idea: ${dto.userPrompt || 'Create a polished cinematic ticket design.'}`,
                `Movie data: ${JSON.stringify({
                  title: dto.movieTitle,
                  runtime: dto.runtime,
                  genres: dto.genres,
                  cinema: dto.cinema,
                  hall: dto.hall,
                  startTime: dto.startTime,
                  seats: dto.seats,
                  bookingId: dto.bookingId,
                  backdropCount: dto.backdrops?.length || 0,
                })}`,
              ].join('\n'),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            colorMode: { type: 'STRING' },
            accentColor: { type: 'STRING' },
            accentColor2: { type: 'STRING' },
            gradientAngle: { type: 'NUMBER' },
            backdropOpacity: { type: 'NUMBER' },
            backgroundIndex: { type: 'NUMBER' },
            description: { type: 'STRING' },
            textElements: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  type: { type: 'STRING' },
                  x: { type: 'NUMBER' },
                  y: { type: 'NUMBER' },
                  w: { type: 'NUMBER' },
                  h: { type: 'NUMBER' },
                  fontSize: { type: 'NUMBER' },
                  color: { type: 'STRING' },
                  rotation: { type: 'NUMBER' },
                  fontFamily: { type: 'STRING' },
                },
                required: ['type', 'x', 'y', 'w', 'h', 'fontSize', 'color'],
              },
            },
          },
          required: [
            'colorMode',
            'accentColor',
            'accentColor2',
            'gradientAngle',
            'backdropOpacity',
            'backgroundIndex',
            'textElements',
          ],
        },
      },
    };
  }

  private createFallbackDesign(dto: GenerateTicketDesignDto): AiTicketDesign {
    const hasBackdrop = (dto.backdrops?.length || 0) > 0;

    return {
      colorMode: 'gradient',
      accentColor: '#111827',
      accentColor2: '#e53935',
      gradientAngle: 135,
      backdropOpacity: hasBackdrop ? 0.42 : 1,
      backgroundIndex: hasBackdrop ? 0 : -1,
      description: 'AI styled cinematic ticket design.',
      textElements: [
        { type: 'title', x: 190, y: 78, w: 280, h: 54, fontSize: 26, color: '#ffffff', fontFamily: 'Bebas Neue' },
        { type: 'cinema', x: 190, y: 145, w: 245, h: 32, fontSize: 15, color: '#f8fafc', fontFamily: 'Montserrat' },
        { type: 'startTime', x: 190, y: 186, w: 260, h: 34, fontSize: 15, color: '#f8fafc', fontFamily: 'Montserrat' },
        { type: 'seats', x: 430, y: 272, w: 120, h: 44, fontSize: 24, color: '#ffffff', fontFamily: 'Oswald' },
        { type: 'qr', x: 488, y: 78, w: 84, h: 84, fontSize: 16, color: '#000000' },
      ],
    };
  }

  private sanitizeDesign(
    input: Partial<AiTicketDesign>,
    dto: GenerateTicketDesignDto,
    fallback: AiTicketDesign,
  ): AiTicketDesign {
    const canvasWidth = this.clamp(dto.canvasWidth || 650, 260, 900);
    const canvasHeight = this.clamp(dto.canvasHeight || 430, 180, 700);
    const maxBackdropIndex = (dto.backdrops?.length || 0) - 1;
    const allowedTypes = new Set([
      'title',
      'runtime',
      'genres',
      'cinema',
      'hall',
      'startTime',
      'seats',
      'qr',
      'barcode',
      'id',
    ]);

    const textElements = Array.isArray(input.textElements)
      ? input.textElements
          .filter((el) => allowedTypes.has(el.type as string))
          .slice(0, 8)
          .map((el) => {
            const isCode = el.type === 'qr' || el.type === 'barcode';
            const safe = this.getSafeBox(el.type, canvasWidth, canvasHeight);
            const w = this.clamp(el.w, isCode ? 72 : 70, Math.min(isCode ? 92 : 290, safe.maxX - safe.minX));
            const h = this.clamp(el.h, isCode ? 72 : 28, Math.min(isCode ? 92 : 58, safe.maxY - safe.minY));
            return {
              type: el.type,
              x: this.clamp(el.x, safe.minX, safe.maxX - w),
              y: this.clamp(el.y, safe.minY, safe.maxY - h),
              w,
              h,
              fontSize: this.clamp(el.fontSize, 12, 54),
              color: this.isHexColor(el.color) ? el.color : '#ffffff',
              rotation: this.clamp(el.rotation || 0, -12, 12),
              fontFamily: this.sanitizeFont(el.fontFamily),
            } as AiTextElement;
          })
      : [];

    return {
      colorMode: input.colorMode === 'solid' ? 'solid' : 'gradient',
      accentColor: this.isHexColor(input.accentColor) ? input.accentColor : fallback.accentColor,
      accentColor2: this.isHexColor(input.accentColor2) ? input.accentColor2 : fallback.accentColor2,
      gradientAngle: this.clamp(input.gradientAngle, 0, 360),
      backdropOpacity: this.clamp(input.backdropOpacity, 0, 1),
      backgroundIndex: maxBackdropIndex >= 0 ? this.clamp(input.backgroundIndex, 0, maxBackdropIndex) : -1,
      description: input.description || fallback.description,
      textElements: textElements.length ? textElements : fallback.textElements,
    };
  }

  private clamp(value: unknown, min: number, max: number): number {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return min;
    return Math.min(max, Math.max(min, numberValue));
  }

  private getSafeBox(type: string, canvasWidth: number, canvasHeight: number) {
    const scaleX = canvasWidth / 650;
    const scaleY = canvasHeight / 430;

    if (type === 'qr' || type === 'barcode') {
      return {
        minX: 470 * scaleX,
        maxX: 585 * scaleX,
        minY: 72 * scaleY,
        maxY: 235 * scaleY,
      };
    }

    if (type === 'seats') {
      return {
        minX: 395 * scaleX,
        maxX: 570 * scaleX,
        minY: 235 * scaleY,
        maxY: 330 * scaleY,
      };
    }

    return {
      minX: 185 * scaleX,
      maxX: 555 * scaleX,
      minY: 72 * scaleY,
      maxY: 330 * scaleY,
    };
  }

  private isHexColor(value: unknown): value is string {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
  }

  private sanitizeFont(value?: string): string {
    const allowedFonts = new Set([
      'Inter',
      'Playfair Display',
      'Bebas Neue',
      'Montserrat',
      'Courier Prime',
      'Roboto',
      'Oswald',
      'Lora',
      'Pacifico',
    ]);

    return value && allowedFonts.has(value) ? value : 'Montserrat';
  }
}
