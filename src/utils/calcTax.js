const calculateGST = (basePrice, gstRate)  => {
    // Calculate GST amount
    let gstAmount = (basePrice * gstRate) / 100;

    // Calculate total price including GST
    let totalPrice = basePrice + gstAmount;
    
    // Return GST amount and total price
    return {
        gstAmount: gstAmount,
        totalPrice: totalPrice
    };
}

module.exports = calculateGST;

