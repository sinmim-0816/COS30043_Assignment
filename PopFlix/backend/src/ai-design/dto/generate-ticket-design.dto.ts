export class GenerateTicketDesignDto {
  movieTitle?: string;
  runtime?: string;
  genres?: string[];
  cinema?: string;
  hall?: string;
  startTime?: string;
  seats?: string[];
  bookingId?: string;
  backdrops?: string[];
  currentBackdropIndex?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}
