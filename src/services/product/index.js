const Category = require("../../models/category");
const {
  generateCategoryID,
  generateProductID,
} = require("../../utils/generateID");
const { getDateCreated } = require("../../utils/createDate");
const product = require("../../models/product");
const User = require("../../models/user");
const Org = require("../../models/Org");
module.exports = class Product {
  async createCategory({ req, catName, imageUrl }) {
    try {
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
 
      const getproduct = await product.findOne({
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
      if (getproduct)
        return { status: "error", message: "Product already exists" };

      return await product
        .create({
          type: body.type,
          name: body.name,
          productId,
          withinTax:body.withinTax,
          userId: req.session.userId,
          orgId: req.session.orgId,
          categoryId:
            body.categoryId == undefined ? undefined : body.categoryId,
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
            value: taxValue ,
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
          product.erpDetails.erpActive = !product.erpDetails.erpActive;
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
};
