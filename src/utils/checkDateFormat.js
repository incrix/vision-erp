exports.isValidDateFormat = (dateString, format) => {
    let regex;
 
    // Define regex patterns for different date formats
    switch (format) {

        case 'YYYY-MM-DD':
            regex = /^\d{4}-\d{2}-\d{2}$/;
            break;
        case 'DD-MM-YYYY':
    
            regex = /^\d{2}-\d{2}-\d{4}$/;
            break;
        case 'MM-DD-YYYY':
            regex = /^\d{2}-\d{2}-\d{4}$/;
            break
        default:
            return false; // Unsupported format

        // case 'YYYY-MM-DD':
        //     regex = /^\d{4}-\d{2}-\d{2}$/;
        //     break;
        // case 'DD/MM/YYYY':
        //     regex = /^\d{2}\/\d{2}\/\d{4}$/;
        //     break;
        // case 'MM-DD-YYYY':
        //     regex = /^\d{2}-\d{2}-\d{4}$/;
        //     break;
        // default:
        //     return false; // Unsupported format
    }
  
    // Check if dateString matches the regex
    if (!regex.test(dateString)) {
        return false;
    }
  
    // Parse the date parts based on the format
    let parts;
    let day, month, year;
  
    switch (format) {
        case 'YYYY-MM-DD':
            parts = dateString.split('-');
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1; // months are 0-based in JS
            day = parseInt(parts[2], 10);
            break;
        case 'DD-MM-YYYY':
            parts = dateString.split('-');
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
            break;
        case 'MM-DD-YYYY':
            parts = dateString.split('-');
            month = parseInt(parts[0], 10) - 1;
            day = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
            break;
    }
  
    // Create a Date object
    const date = new Date(year, month, day);
  
    // Check if the Date object represents the correct date
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return false;
    }
  
    return true;
  }
