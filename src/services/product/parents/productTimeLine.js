const Product = require("../../../models/product");
const timeLine = require("../../../models/productTimeLine");
module.exports = class productTimeLine {
  async checkProductLine({ items, session, resolve, reject }) {
    try {
      const getProduct = await Product.find({
        orgId: session.orgId,
        productId: { $in: [...items.map((item) => item.productId)] },
        isSales: true,
      });
      if (getProduct.length !== items.length)
        return reject({ status: "error", message: "Product not found" });
      const getEncrypt = await this.encryptData(items);
      if (getEncrypt.status == "error")
        return reject({ status: "error", message: getEncrypt.message });

      return resolve({ ...getEncrypt, getProduct });
    } catch (error) {
      console.log(error);

      return reject({ status: "error", message: error.message });
    }
  }
  async productTimeLine({ req, services, callback }) {
    try {
      const { isEncrypt } = req.body;
      if (isEncrypt) {
        let getEncrypt = await this.decryptData(req.body.data);

        if (getEncrypt.status == "error") return callback(null, getEncrypt);
        req.body.data = getEncrypt.data;
      }

      const getPromise = await new Promise((resolve, reject) => {
        (async () => {
          await this.checkProductLine({
            ...req,
            ...req.body.data,
            resolve,
            reject,
          });
        })();
      });
      if (getPromise.status == "error") return callback(null, getPromise);
      const { getProduct } = getPromise;
      const { items, invoiceId, date, type } = req.body.data;
      const getTimeline = await timeLine.findOne({
        orgId: req.session.orgId,
      });
      for (let i = 0; i < invoiceId.length; i++) {
        const getPromise = await new Promise((resolve, reject) => {
          (async () => {
            await items.map((task) => {
              getProduct.map(async (product) => {
                if (task.productId == product.productId)
                  await this.addProductCounting({
                    req,
                    type,
                    product,
                    documentItem: task,
                    clientCount: invoiceId.length,
                    getTimeline,
                    callback,
                    docId: invoiceId[i],
                    date,
                    resolve,
                    reject,
                  });
              });
            });
          })();
        });
        if (getPromise.status == "error")
          return callback(null, {
            status: "error",
            message: getPromise.message,
          });
      }
      for(var i = 0; i < getProduct.length; i++) {
       await getProduct[i].save()
      }
     await getTimeline.save()
      return callback({ status: "success", message: "successfully Add product " });
    } catch (error) {
      console.log(error);
      return callback(null, { status: "error", message: error.message });
    }
  }
  async addProductCounting({
    req,
    docId,
    date,
    type,
    product,
    documentItem,
    getTimeline,
    resolve,
    reject,
  }) {
    try {
      product.stockQty =
        type == "invoice"
          ? this.countProductForInvoice(product.stockQty, documentItem.quantity)
          : this.countProductForPurchase(
              product.stockQty,
              documentItem.quantity
            );
      getTimeline.productList.push({
        name: documentItem.name,
        productId: product.productId,
        quantity: documentItem.quantity,
        date,
        source: docId,
        invoiceId: req.body.invoiceId,
        orgId: req.session.orgId,
        stockIn: type == "purchase" ? documentItem.quantity : 0,
        stockOut: type == "invoice" ? documentItem.quantity : 0,
        unit: documentItem.unit,
        billingDetails: {
          price: documentItem.price,
          unitPrice: documentItem.unitPrice,
          price: documentItem.price,
          totalPrice: documentItem.totalPrice,
          discount: documentItem.discount,
        },
        user: {
          id: req.session.userId,
          name: req.session.name,
        },
      });
      resolve({status: "success", message:"Success "});
    } catch (error) {
      console.log(error);

      return reject({ status: "error", error: error.message });
    }
  }
  countProductForInvoice = (stockQty, quantity) => {
    if (stockQty > 0) {
      return stockQty - quantity;
    }
    return stockQty - quantity;
  };

  countProductForPurchase = (stockQty, quantity) => {
    if (stockQty > 0) {
      return stockQty + quantity;
    }
    return stockQty + quantity;
  };
};
