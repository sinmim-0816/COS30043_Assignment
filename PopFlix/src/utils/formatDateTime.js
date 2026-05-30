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