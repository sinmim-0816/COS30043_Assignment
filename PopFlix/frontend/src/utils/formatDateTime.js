export const formatMonthYear = (dateSource) => {
    if (!dateSource) return '';

    const date = new Date(dateSource);

    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export function formatTicketDate(dateInput) {
    if (!dateInput) return 'N/A';

    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
        return 'N/A';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}