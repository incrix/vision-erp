const Product = require("../../../models/product");
const timeLine = require("../../../models/productTimeLine");
module.exports = class productTimeLine {
  async checkProductLine({ items, session, resolve, reject }) {
    try {
      const getProduct = await this.getAllProductsForCheck({
        session,
        items,
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
  async getAllProductsForCheck({ session, items, isSales }) {
    if (isSales)
      return await Product.find({
        orgId: session.orgId,
        productId: { $in: [...items.map((item) => item.productId)] },
        isSales: true,
      });
    else
      return await Product.find({
        orgId: session.orgId,
        productId: { $in: [...items.map((item) => item.productId)] },
      });
  }
  async productTimeLine({ req, services, callback }) {
    try {
      let getEncrypt = await this.decryptData(req.body.data);

      if (getEncrypt.status == "error") return callback(null, getEncrypt);
      req.body.data = getEncrypt.data;

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
      const { items, date, docId, type } = req.body.data;
      if (!Array.isArray(docId))
        return callback(null, { status: "error", message: "Invalid docId " });
      const getTimeline = await timeLine.findOne({
        orgId: req.session.orgId,
      });
      if (!getTimeline)
        return callback(null, {
          status: "error",
          message: "no timeline available",
        });

      if (req.path == "/edit-documents-add-product")
        return await this.editProductTimeline({
          req,
          ...req.body.data,
          getProduct,
          callback,
        });
      const getPromiseForCheckProduct = await new Promise((resolve, reject) => {
        (async () =>
          await this.checkProductIntoProductAndTimeline({
            getProduct,
            req,
            type,
            date,
            items,
            getTimeline,
            callback,
            docId,
            resolve,
            reject,
          }))();
      });
      if (getPromiseForCheckProduct.status == "error")
        return callback(null, getPromiseForCheckProduct);
      for (var i = 0; i < getProduct.length; i++) {
        await getProduct[i].save();
      }
      await getTimeline.save();
      return callback({
        status: "success",
        message: "successfully Add product ",
      });
    } catch (error) {
      console.log(error);
      return callback(null, { status: "error", message: error.message });
    }
  }
  async checkProductIntoProductAndTimeline({
    getProduct,
    req,
    type,
    date,
    getTimeline,
    callback,
    docId,
    items,
    resolve,
    reject,
  }) {
    try {
      for (let i = 0; i < docId.length; i++) {
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
                    getTimeline,
                    callback,
                    docId: docId[i],
                    date,
                    resolve,
                    reject,
                  });
              });
            });
          })();
        });
        if (getPromise.status == "error")
          return reject({
            status: "error",
            message: getPromise.message,
          });
      }

      return resolve({ status: "success", message: "success" });
    } catch (error) {
      console.log(error.message);
      return reject({
        status: "error",
        message: error.message,
      });
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
      if (
        type == "purchase" ||
        // type == "cancelPurchase" ||
        type == "editInvoice"
      )
        product.stockQty = this.countProductForPurchase(
          product.stockQty,
          documentItem.quantity
        );
      else
        product.stockQty = this.countProductForInvoice(
          product.stockQty,
          documentItem.quantity
        );
      type == "cancelPurchase" ||
      type == "cancelInvoice" ||
      type == "editInvoice"
        ? getTimeline.productList.map((task) => {
            if (task.source == docId) {
              if (task.isCancelled && type !== "editInvoice")
                return reject({
                  status: "error",
                  message: `The ${task.name} Stock was already cancelled in this invoice ${docId}`,
                });
              task.isCancelled = true;
            }
            return task;
          })
        : getTimeline.productList.push({
            name: documentItem.name,
            productId: product.productId,
            date,
            source: docId,
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

      return resolve({ status: "success", message: "Success " });
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

  async editProductTimeline({
    req,
    items,
    date,
    docId,
    type,
    oldItems,
    getProduct: newProduct,
    callback,
  }) {
    try {
      if (!Array.isArray(docId))
        return callback(null, { status: "error", message: "Invalid docId " });
      const getOldProduct = await this.getAllProductsForCheck({
        ...req,
        items,
        isSales: false,
      });
      if (getOldProduct.length !== items.length)
        return callback(null, {
          status: "error",
          message:
            "the old invoice product could not be found in the list of products",
        });
      const getTimeline = await timeLine.findOne({
        orgId: req.session.orgId,
      });
      if (!getTimeline)
        return callback(null, {
          status: "error",
          message: "no timeline available",
        });
      const getProductId = [];
      const getProduct = [];
      let getPromise = await new Promise((resolve, reject) =>
        (async () => {
          await [...newProduct, ...getOldProduct].map((product) => {
            if (!getProductId.includes(product.productId)) {
              getProductId.push(product.productId);
              getProduct.push(product);
            }
            return;
          });
          // console.log(getProduct);
          return resolve({ status: "success", message: "success" });
        })()
      );
      if (getPromise.status == "error") return callback(null, getPromise);
      getPromise = await new Promise((resolve, reject) => {
        (async () => {
          await this.checkProductIntoProductAndTimeline({
            getProduct,
            items: oldItems,
            req,
            type,
            date,
            getTimeline,
            callback,
            docId,
            resolve,
            reject,
          });
        })();
      });
      if (getPromise.status === "error") return callback(null, getPromise);

      getPromise = await new Promise((resolve, reject) => {
        (async () => {
          await this.checkProductIntoProductAndTimeline({
            getProduct,
            items,
            req,
            type: "invoice",
            date,
            getTimeline,
            callback,
            docId,
            resolve,
            reject,
          });
        })();
      });
      if (getPromise.status == "error") return callback(null, getPromise);

      for (var i = 0; i < getProduct.length; i++) {
        await getProduct[i].save();
      }
      await getTimeline.save();
      // console.log(getProduct);
      return callback({
        status: "success",
        message: "Product updated successfully with edit",
      });
    } catch (error) {
      return callback({ status: "error", message: error.message });
    }
  }
};


function getMaxProfit(stockPrices) {
  let maxProfit = 0;

  // Go through every time
  for (let outerTime = 0; outerTime < stockPrices.length; outerTime++) {

    // For each time, go through every other time
    for (let innerTime = 0; innerTime < stockPrices.length; innerTime++) {

      // For each pair, find the earlier and later times
      const earlierTime = Math.min(outerTime, innerTime);
      const laterTime = Math.max(outerTime, innerTime);


      // And use those to find the earlier and later prices
      const earlierPrice = stockPrices[earlierTime];
      const laterPrice = stockPrices[laterTime];

      // See what our profit would be if we bought at the
      // min price and sold at the current price
      const potentialProfit = laterPrice - earlierPrice;

      // Update maxProfit if we can do better
      maxProfit = Math.max(maxProfit, potentialProfit);
    }
  }

  return maxProfit;
}


const stockPrices = [10, 7, 5, 8, 11, 9];


console.log(getMaxProfit(stockPrices));



