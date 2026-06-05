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
  source?: 'gemini' | 'fallback';
  notice?: string;
};

@Injectable()
export class AiDesignService {
  constructor(private readonly configService: ConfigService) {}

  async generateTicketDesign(dto: GenerateTicketDesignDto): Promise<AiTicketDesign> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const fallback = this.createFallbackDesign(dto, 'Gemini is not configured, so a local design was applied.');

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
        return this.createFallbackDesign(dto, 'Gemini returned an empty response, so a local design was applied.');
      }

      return {
        ...this.sanitizeDesign(JSON.parse(text), dto, fallback),
        source: 'gemini',
      };
    } catch (error) {
      console.error('Gemini ticket design failed:', error);
      if (this.configService.get<string>('AI_DESIGN_STRICT') === 'true') {
        throw new InternalServerErrorException('AI ticket design failed');
      }
      return this.createFallbackDesign(dto, 'Gemini request failed, so a local design was applied.');
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
                'The user prompt is the highest priority for style, colors, mood, and component choices.',
                'Choose accent colors based on the user prompt, movie title, genres, and available backdrop count.',
                'If backdropCount is greater than 0, choose a backgroundIndex from the available backdrop list.',
                `Variation seed: ${dto.variationSeed || Date.now()}. Use it to avoid repeating the same composition.`,
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

  private createFallbackDesign(dto: GenerateTicketDesignDto, notice: string): AiTicketDesign {
    const hasBackdrop = (dto.backdrops?.length || 0) > 0;
    const seedText = `${dto.movieTitle || ''}|${dto.userPrompt || ''}|${dto.variationSeed || ''}`;
    const seed = this.hash(seedText);
    const palette = this.pickPalette(dto.userPrompt || '', dto.genres || [], seed);
    const layoutVariant = seed % 3;
    const backgroundIndex = hasBackdrop ? seed % (dto.backdrops?.length || 1) : -1;
    const useBarcode = /barcode|bar code/i.test(dto.userPrompt || '') || layoutVariant === 2;

    const layouts: AiTextElement[][] = [
      [
        { type: 'title', x: 190, y: 78, w: 280, h: 54, fontSize: 26, color: palette.text, fontFamily: 'Bebas Neue' },
        { type: 'cinema', x: 190, y: 145, w: 245, h: 32, fontSize: 15, color: palette.muted, fontFamily: 'Montserrat' },
        { type: 'startTime', x: 190, y: 186, w: 260, h: 34, fontSize: 15, color: palette.muted, fontFamily: 'Montserrat' },
        { type: 'seats', x: 430, y: 272, w: 120, h: 44, fontSize: 24, color: palette.text, fontFamily: 'Oswald' },
        { type: useBarcode ? 'barcode' : 'qr', x: 488, y: 78, w: 84, h: 84, fontSize: 16, color: '#000000' },
      ],
      [
        { type: 'title', x: 205, y: 92, w: 250, h: 48, fontSize: 24, color: palette.text, fontFamily: 'Playfair Display' },
        { type: 'genres', x: 205, y: 154, w: 210, h: 30, fontSize: 14, color: palette.muted, fontFamily: 'Montserrat' },
        { type: 'startTime', x: 205, y: 194, w: 250, h: 32, fontSize: 15, color: palette.text, fontFamily: 'Montserrat' },
        { type: 'seats', x: 420, y: 274, w: 135, h: 44, fontSize: 24, color: palette.text, fontFamily: 'Bebas Neue' },
        { type: useBarcode ? 'barcode' : 'qr', x: 484, y: 82, w: 88, h: 88, fontSize: 16, color: '#000000' },
      ],
      [
        { type: 'title', x: 190, y: 86, w: 255, h: 48, fontSize: 23, color: palette.text, fontFamily: 'Oswald' },
        { type: 'cinema', x: 190, y: 154, w: 235, h: 30, fontSize: 14, color: palette.muted, fontFamily: 'Montserrat' },
        { type: 'hall', x: 190, y: 192, w: 140, h: 30, fontSize: 14, color: palette.muted, fontFamily: 'Montserrat' },
        { type: 'seats', x: 415, y: 270, w: 145, h: 44, fontSize: 25, color: palette.text, fontFamily: 'Bebas Neue' },
        { type: useBarcode ? 'barcode' : 'qr', x: 488, y: 86, w: 84, h: 84, fontSize: 16, color: '#000000' },
      ],
    ];

    return {
      colorMode: 'gradient',
      accentColor: palette.primary,
      accentColor2: palette.secondary,
      gradientAngle: [45, 135, 210, 300][seed % 4],
      backdropOpacity: hasBackdrop ? 0.48 : 1,
      backgroundIndex,
      description: `Ticket design inspired by ${dto.userPrompt || dto.movieTitle || 'the movie'}.`,
      textElements: layouts[layoutVariant],
      source: 'fallback',
      notice,
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

  private hash(value: string): number {
    return [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
  }

  private pickPalette(prompt: string, genres: string[], seed: number) {
    const text = `${prompt} ${genres.join(' ')}`.toLowerCase();
    const palettes = [
      { primary: '#111827', secondary: '#d4af37', text: '#ffffff', muted: '#f8fafc' },
      { primary: '#051923', secondary: '#00b4d8', text: '#ffffff', muted: '#d7f9ff' },
      { primary: '#2d0a0a', secondary: '#e53935', text: '#ffffff', muted: '#ffe5e5' },
      { primary: '#0f172a', secondary: '#22c55e', text: '#ffffff', muted: '#dcfce7' },
      { primary: '#1f1235', secondary: '#f472b6', text: '#ffffff', muted: '#fce7f3' },
      { primary: '#f8fafc', secondary: '#334155', text: '#111827', muted: '#1f2937' },
    ];

    if (text.includes('gold') || text.includes('luxury') || text.includes('premium')) return palettes[0];
    if (text.includes('blue') || text.includes('sci') || text.includes('future')) return palettes[1];
    if (text.includes('red') || text.includes('horror') || text.includes('action')) return palettes[2];
    if (text.includes('green') || text.includes('nature')) return palettes[3];
    if (text.includes('pink') || text.includes('romance') || text.includes('playful')) return palettes[4];
    if (text.includes('minimal') || text.includes('clean') || text.includes('white')) return palettes[5];

    return palettes[seed % palettes.length];
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
