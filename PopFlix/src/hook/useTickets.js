import { ref } from 'vue';
import { bookingService } from '@/services/bookingService';
import { getShowtimeById } from '@/services/movieShowtime';
import { movieRepository } from '@/services/movieRepository';
import { IMAGE_BASE_URL } from '@/api/client';

const EXPERIENCE_COLORS = {
    IMAX: '#5f9cff',
    DOLBY: '#ff2a5f',
    '4DX': '#b46cff',
    LUXE: '#ffd166',
    INDULGE: '#ff9f00',
    BEANIE: '#68ffd7',
    JUNIOR: '#ffc2d6',
};

const formatRuntime = (minutes) => {
    const total = Number(minutes || 0);
    if (!total) return 'N/A';

    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${mins}m`;
};

const getImageURL = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${IMAGE_BASE_URL}${path}`;
};

const formatSeat = (seatNumber) => {
    const parts = String(seatNumber || '').split('-');
    return parts.length >= 2 ? parts.slice(-2).join('') : seatNumber;
};

const getTicketStatus = (booking, showtime) => {
    if (booking.status !== 'PAID') return booking.status;
    if (!showtime?.start_time) return 'CONFIRMED';
    return new Date(showtime.start_time) > new Date() ? 'UPCOMING' : 'COMPLETED';
};

const buildTicket = async (booking) => {
    const showtime = await getShowtimeById(booking.showtimeId);
    const movieId = showtime?.movie_id || showtime?.movieId;
    const movieResponse = movieId ? await movieRepository.getMovieDetails(movieId) : null;
    const movie = movieResponse?.data?.movie || {};
    const experience = showtime?.experience?.exp_key || 'STANDARD';
    const themeColor = EXPERIENCE_COLORS[experience] || '#ff2a5f';

    return {
        id: `PFX-${String(booking.id).padStart(6, '0')}`,
        bookingId: booking.id,
        movie_id: movieId,
        title: movie.title || `Booking #${booking.id}`,
        genres: movie.genres || [],
        runtime: formatRuntime(movie.runtime),
        certificate: movie.adult ? 'P18' : 'P13',
        cinema: showtime?.cinema?.name || 'Cinema unavailable',
        hall: showtime?.hall_name || 'Hall unavailable',
        startTime: showtime?.start_time || booking.createdAt,
        seats: (booking.tickets || []).map((ticket) => formatSeat(ticket.seatNumber)),
        experience,
        parkingSpot: booking.parkingSpot || 'None',
        parkingNote: booking.parkingSpot ? 'Parking validation included' : 'No parking selected',
        backdrop: getImageURL(movie.backdrop) || getImageURL(movie.poster),
        poster: getImageURL(movie.poster) || getImageURL(movie.backdrop),
        themeColor,
        glassGlow: `${themeColor}40`,
        status: getTicketStatus(booking, showtime),
        totalPrice: Number(booking.totalPrice || 0),
        raw: { booking, showtime, movie },
    };
};

export function useTickets() {
    const ticketsList = ref([]);
    const singleTicket = ref(null);
    const isTicketsLoading = ref(false);
    const ticketsError = ref(null);

    const fetchTickets = async () => {
        isTicketsLoading.value = true;
        ticketsError.value = null;

        try {
            const bookings = await bookingService.getMyBookings();
            const paidBookings = (bookings || []).filter((booking) => booking.status === 'PAID');
            const tickets = await Promise.all(paidBookings.map(buildTicket));

            ticketsList.value = tickets.sort(
                (a, b) => new Date(a.startTime) - new Date(b.startTime),
            );

            return ticketsList.value;
        } catch (err) {
            console.error('Failed to load tickets pipeline:', err);
            ticketsError.value = err.response?.data?.message || 'Failed to fetch your tickets.';
            ticketsList.value = [];
            return [];
        } finally {
            isTicketsLoading.value = false;
        }
    };

    const fetchTicketDetails = async (bookingId) => {
        isTicketsLoading.value = true;
        ticketsError.value = null;

        try {
            const booking = await bookingService.getBookingDetails(bookingId);
            const ticket = await buildTicket(booking);
            singleTicket.value = ticket;
            return ticket;
        } catch (err) {
            console.error(`Failed to load ticket details for booking ${bookingId}:`, err);
            ticketsError.value = err.response?.data?.message || 'Failed to retrieve ticket details.';
            throw err;
        } finally {
            isTicketsLoading.value = false;
        }
    };

    return {
        ticketsList,
        singleTicket,
        isTicketsLoading,
        ticketsError,
        fetchTickets,
        fetchTicketDetails,
    };
}
