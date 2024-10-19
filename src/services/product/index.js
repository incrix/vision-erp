const Category = require("../../models/category");
const {
  generateCategoryID,
  generateProductID,
} = require("../../utils/generateID");
const { getDateCreated } = require("../../utils/createDate");
const product = require("../../models/product");
const User = require("../../models/user");
const Org = require("../../models/Org");
const {
  addQuantityThroughIndex,
  addQuantityThroughLoop,
} = require("./productUtil");
const Vendor = require("../../models/vendor");
const Customer = require("../../models/customer");
const productDecodeEncoder = require("./parents/productDecodeEncode");
const productTimeLine = require("./parents/productTimeLine");
function Classes(bases) {
  class Bases {
    constructor() {
      bases.forEach((base) => Object.assign(this, new base()));
    }
  }
  bases.forEach((base) => {
    Object.getOwnPropertyNames(base.prototype)
      .filter((prop) => prop != "constructor")
      .forEach((prop) => (Bases.prototype[prop] = base.prototype[prop]));
  });
  return Bases;
}

module.exports = class Product extends (
  Classes([productDecodeEncoder, productTimeLine])
) {
  async createCategory({ req, catName, imageUrl }) {
    try {
      if (catName == "" || catName == undefined)
        return { status: "error", message: "Please check the Category Name" };
      return await Category.findOne({
        userId: req.session.userId,
        orgId: req.session.orgId,
      }).then(async (category) => {
        if (category == null)
          return { status: "error", message: "can't find user" };
        const getCat =
          category.catList.length > 0
            ? await category.catList.filter((c) => c.name == catName)
            : 0;
        if (getCat.length > 0) {
          return { status: "error", message: "Category already exists" };
        }

        category.catList.push({
          name: catName,
          catId: await generateCategoryID(),
          catImageUrl: imageUrl == undefined || imageUrl == "" ? "" : imageUrl,
          online: imageUrl == undefined || imageUrl == "" ? false : true,
        });
        await category.save();
        return { status: "success", message: "Category added successfully" };
      });
    } catch (error) {
      throw error;
    }
  }

  async getCategory({ req }) {
    try {
      return await Category.findOne({
        userId: req.session.userId,
        orgId: req.session.orgId,
      })
        .then((category) => {
          return {
            status: "success",
            message: "get category successfully",
            data: category.catList,
          };
        })
        .catch((error) => {
          return { status: "error", message: "get category failed" };
        });
    } catch (error) {
      throw error;
    }
  }

  async createProduct({ req, body }) {
    try {
      const { getDate, getTime, getDateMilliseconds } = await getDateCreated();
      const productId = await generateProductID();

      let taxValue = body.withinTax
        ? body.unitPrice - (body.unitPrice * 100) / (100 + body.taxRate)
        : (body.unitPrice * body.taxRate) / 100;
      console.log(taxValue);

      const getProduct = await product.findOne({
        userId: req.session.userId,
        type: body.type,
        productId,
      });
      const org = await Org.findOne({
        userId: req.session.userId,
        _id: req.session.orgId,
      });

      const user = await User.findOne({ _id: req.session.userId });
      if (!user) return { status: "error", message: "user are not authorized" };
      if (!org) return { status: "error", message: "are not authorized" };
      if (getProduct)
        return { status: "error", message: "Product already exists" };

      return await product
        .create({
          type: body.type,
          name: body.name,
          productId,
          withinTax: body.withinTax,
          userId: req.session.userId,
          orgId: req.session.orgId,
          category: body.category == undefined ? undefined : body.category,
          barcode: body.barcode,
          date: getDate,
          time: getTime,
          dateMilliseconds: getDateMilliseconds,
          unitPrice:
            body.withinTax == true ? body.unitPrice - taxValue : body.unitPrice,
          priceWithTax: body.withinTax
            ? body.unitPrice
            : eval(body.unitPrice) + eval(taxValue),
          purchasePrice: body.purchasePrice,
          tax: {
            rate: body.taxRate,
            value: taxValue,
          },
          stockQty: body.stockQty,
          isSales: body.isSales,
          unit: body.unit,
          description: body.description,
          discount: body.discount,
        })
        .then(async (createProductResponse) => {
          return { status: "success", message: "Product added successfully" };
        })
        .catch((err) => {
          console.log(err);
          return { status: "error", message: "Product added failed " };
        });
    } catch (error) {
      throw error;
    }
  }

  // Decrease and Increase The Product Count
  // async productDecreaseOrIncrease({ callBack, clientCount, list, req }) {
  //   try {
  //     if (list.length == 0)
  //       return callBack(null, {
  //         status: "error",
  //         message: "Something wrong at Product",
  //       });
  //     const productList = await product.find({
  //       userId: req.session.userId,
  //       orgId: req.session.orgId,
  //     });
  //     if (!productList)
  //       return callBack(null, {
  //         status: "error",
  //         message: "Something went wrong at Product getting",
  //       });
  //     if (productList.length < 0)
  //       return callBack(null, {
  //         status: "error",
  //         message: "You don't have Product",
  //       });
  //     for (let i = 0; i < list.length; i++) {
  //       const productCheck = productList[list[i].productIndex];
  //       if (productCheck !== undefined)
  //         if (
  //           productCheck.productId == list[i].productId &&
  //           productCheck.name == list[i].name
  //         ) {
  //           const getWait = await new Promise((resolve, reject) => {
  //             (async () => {
  //               return await addQuantityThroughIndex({
  //                 productList,
  //                 index: i,
  //                 clientCount,
  //                 type: req.body.type,
  //                 list,
  //                 resolve,
  //                 reject,
  //               });
  //             })();
  //           });
  //           if (getWait.status == "error") return callBack(null, getWait);
  //         } else {
  //           const getWait = await new Promise((resolve, reject) => {
  //             (async () => {
  //               return await addQuantityThroughLoop({
  //                 productList,
  //                 index: i,
  //                 list,
  //                 clientCount,
  //                 type: req.body.type,
  //                 resolve,
  //                 reject,
  //               });
  //             })();
  //           });
  //           if (getWait.status == "error") return callBack(null, getWait);
  //         }
  //       else
  //         return callBack(null, {
  //           status: "error",
  //           message: "Something went wrong with the product.",
  //         });
  //     }
  //     return callBack(
  //       {
  //         status: "success",
  //         message: "Successfully added product quantity",
  //       },
  //       false
  //     );
  //   } catch (error) {
  //     return callBack(null, { status: "error", message: error.message });
  //   }
  // }
  //Get All Product
  async getAllProducts({ req }) {
    try {
      return await product
        .find({ userId: req.session.userId, orgId: req.session.orgId })
        .then((product) => {
          return {
            status: "success",
            message: "Get all product successfully",
            data: product,
          };
        })
        .catch((error) => {
          return { status: "error", message: "Get all product failed" };
        });
    } catch (error) {
      throw error;
    }
  }
  async productActive({ req, productId }) {
    try {
      return await product
        .findOne({
          productId,
          userId: req.session.userId,
          orgId: req.session.orgId,
        })
        .then(async (product) => {
          if (product == null)
            return {
              status: "error",
              message: "Product not found",
            };
          product.isSales = !product.isSales;
          await product.save();
          return {
            status: "success",
            message: "ERP Product active status changed successfully",
          };
        })
        .catch((error) => {
          console.log(error);
          return {
            status: "error",
            message: "Product active status changed failed",
          };
        });
    } catch (error) {
      return { status: "error", message: "something went wrong" };
    }
  }
  // add product check function call
  async isCallProductQuantity({ req, res }) {
    try {
      const type = req.body.type;
      const client = type == "invoice" ? req.body.cusId : req.body.venId;

      if (client.length < 0)
        return res
          .status(203)
          .json({ status: "error", message: "Please select a client" });
      for (var i = 0; i < client.length; i++) {
        if (type == "invoice") {
          const cus = await Customer.findOne({ _id: client[i] }).catch((err) =>
            res.status(203).json({ status: "error", message: err.message })
          );
          if (cus == null)
            return res
              .status(403)
              .json({ status: "error", message: "can't find Customer" });
        } else if (type == "purchase") {
          const ven = await Vendor.findOne({ _id: client[i] }).catch((err) =>
            res.status(203).json({ status: "error", message: err.message })
          );
          if (ven == null)
            return res
              .status(403)
              .json({ status: "error", message: "can't find Vendor" });
        } else {
          return res
            .status(203)
            .json({ status: "error", message: "Something went wrong in type" });
        }
      }
      const getPromise = await new Promise((resolve, reject) => {
        (async () => {
          await this.checkProductLine({ ...req,...req.body, resolve, reject });
        })();
      });
      if (getPromise.status == "error") return res.status(404).json(getPromise);
      const {status,message,data} = getPromise
      return res.status(200).json({status,message,data});

      // await this.productDecreaseOrIncrease({
      //   req,
      //   list: req.body.items,
      //   clientCount:
      //     type == "invoice" ? req.body.cusId.length : req.body.venId.length,
      //   callBack: (err, data) => {
      //     if (err) return res.status(401).json(err);
      //     return res.json(data);
      //   },
      // });
      
    } catch (error) {
      console.log(error);
      return res.status(203).json({ status: "error", message: error.message });
    }
  }
};
