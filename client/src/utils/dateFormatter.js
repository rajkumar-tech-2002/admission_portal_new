// Safely extract YYYY-MM-DD from any date string without timezone shift
const extractDateParts = (dateStr) => {
    if (!dateStr) return null;
    // Takes the first 10 chars: handles both '2008-12-14' and '2008-12-14T18:30:00.000Z'
    const datePart = String(dateStr).substring(0, 10);
    const parts = datePart.split('-');
    if (parts.length !== 3) return null;
    return { year: parts[0], month: parts[1], day: parts[2] };
};

export const formatDate = (dateStr) => {
    const parts = extractDateParts(dateStr);
    if (!parts) return '';
    return `${parts.day}-${parts.month}-${parts.year}`;
};

export const formatDateForInput = (dateStr) => {
    const parts = extractDateParts(dateStr);
    if (!parts) return '';
    return `${parts.year}-${parts.month}-${parts.day}`;
};


export const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const formattedDate = formatDate(dateStr);
    const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    return `${formattedDate} ${time}`;
};
