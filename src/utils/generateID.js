const { v4: uuidv4 } = require('uuid');
exports.generateCategoryID = () =>{
    let id = '';
    // Generate UUID
    for (let i = 0; i < 10; i++) {
        id += uuidv4().split('-').join('');
    }
    // Append timestamp
    const timestamp = Date.now().toString(16); // Convert timestamp to hexadecimal string
    id += timestamp;
    return id.substring(0, 6); // Truncate to desired length
}

exports.genereateInvoiceId = (indexCount) =>{
 
    if(indexCount.length == 0) return `#INV-0${++indexCount.length}`
    if(indexCount.length+1 <= 9) return `#INV-0${indexCount.length+1}`
    else return `#INV-${indexCount.length+1}`
}

exports.generateProductID = () =>{
    let id = '';
    // Generate UUID
    for (let i = 0; i < 10; i++) {
        id += uuidv4().split('-').join('');
    }
    // Append timestamp
    const timestamp = Date.now().toString(16); // Convert timestamp to hexadecimal string
    id += timestamp;
    return id.substring(0, 10); // Truncate to desired length
}