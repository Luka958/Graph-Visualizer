function formatDate(dateString) {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
        console.error('Invalid date');
        return null;
    }

    let day = date.getDate().toString().padStart(2, '0'); // Ensure day is 2 digits
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-based, ensure month is 2 digits
    let year = date.getFullYear(); // Year as is

    return `${year}-${month}-${day}`; // Return in YYYY-MM-DD format
}

module.exports = { formatDate };
