const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/payment')
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

exports.generatePaymentId = async ({orgId,type}) =>{
   const payment = await Payment.find({orgId,type})

   if (type == "in")
 return await payInId({indexCount:payment.length})
else if (type == "out") return await payOutId({indexCount:payment.length})
 
} 

function payInId({indexCount}){
    if(indexCount == 0) return `#PAYIN-0${indexCount+1}`
    if(indexCount+1 <= 9) return `#PAYIN-0${indexCount+1}`
    else return `#PAYIN-${indexCount+1}`
}
function payOutId({indexCount}){
    if(indexCount == 0) return `#PAYOUT-0${indexCount+1}`
    if(indexCount+1 <= 9) return `#PAYOUT-0${indexCount+1}`
    else return `#PAYOUT-${indexCount+1}`
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