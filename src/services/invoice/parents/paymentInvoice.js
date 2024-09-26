const invoice = require("../../../models/invoice");
const { getAmountStatus } = require("../invoiceUtil");
module.exports = class paymentInvoice {
  constructor() {}
  // its called from the payment index function when the payment want to be cancelled
  async cancelPaymentInvoice({ req, getPayment,getClient, resolve, reject }) {
    try {
      const getId = [];
      const collectId = [];
      await getPayment.documents.map((doc) => {
        if (!collectId.includes(doc.id)) {
          collectId.push(doc.id);
          getId.push({ id: doc.id, amount: doc.payAmount });
        } else {
          getId[collectId.indexOf(doc.id)].amount += doc.payAmount;
        }
      });
      const getInvoices = await invoice.find({
        orgId: req.session.orgId,
        id: { $in: collectId },
      });
      
      // if(getClient.ledger[getClient.ledger.length -1].id == "#INV-29") return reject({status:"error",message:"Invalid invoice ID #INV-29"})
      await new Promise((resolve, reject) => {
        (async () => {
          await getInvoices.map(async (doc) => {
            if (getId[collectId.indexOf(doc.id)].id !== doc.id)
              return reject({
                status: "error",
                message: `Invalid Invoice ID ${doc.id}`,
              });
               
            doc.paidAmount =
              doc.paidAmount - getId[collectId.indexOf(doc.id)].amount;
            doc.status = await getAmountStatus({
              totalPrice: doc.totalPrice,
              paidAmount: doc.paidAmount,
            });
     
            getClient.ledger.map(ledger =>{
                if(ledger.id == getPayment.id) ledger.isCancelled = true;
                if(ledger.id == doc.id) {
                  ledger.status = doc.status;
                  ledger.amount = doc.totalPrice;
                  ledger.documents = ledger.documents.filter(
                    (fil, index) => fil.id !== getPayment.id
                  );
                }  
              });
            doc.paymentTransactions = [
              ...doc.paymentTransactions.filter(
                (fil, index) => fil.id !== getPayment.id
              ),
            ];
          }); 
                 
          resolve();
        })();
      });
      getClient.balance.currentBalance += getPayment.amount 
      getClient.ledger[getClient.ledger.length - 1].closingBalance = getClient.balance.currentBalance

    //  isCancelled = true if the transaction is cancelled
      getPayment.isCancelled  = true

      // save the change 

      for(let i = 0; i < getInvoices.length; i++) {
        getInvoices[i].save()
      }
      // 
      await getClient.save();
      await getPayment.save();

      return resolve({
        status: "success",
        message: "Invoice has been cancelled successfully",
        data: getInvoices,
      });
    } catch (error) {
      reject({ status: "error", message: error.message });
    }
  }
  async cancelPaymentWithInvoice({ req, getPayment,getClient,getInvoices, resolve, reject }) {
    try {
      const getId = [];
      const collectId = [];
      await getPayment.documents.map((doc) => {
        if (!collectId.includes(doc.id)) {
          collectId.push(doc.id);
          getId.push({ id: doc.id, amount: doc.payAmount });
        } else {
          getId[collectId.indexOf(doc.id)].amount += doc.payAmount;
        }
      });


      await new Promise((resolve, reject) => {
        (async () => {
          await getInvoices.map(async (doc) => {
            if (getId[collectId.indexOf(doc.id)].id !== doc.id)
              return reject({
                status: "error",
                message: `Invalid Invoice ID ${doc.id}`,
              });
               
            doc.status = "cancelled"
     
            getClient.ledger.map(ledger =>{
                if(ledger.id == getPayment.id) ledger.isCancelled = true;
                if(ledger.id == doc.id) {
                  ledger.isCancelled = true;
                  ledger.status = doc.status;
                  ledger.documents = []
                }  
              });
            doc.paymentTransactions = []
          }); 
                 
          resolve();
        })();
      });
    
    //  isCancelled = true if the transaction is cancelled
      getPayment.isCancelled  = true
 

    } catch (error) {
      reject({ status: "error", message: error.message });
    }
  }
};

