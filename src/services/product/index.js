const Category = require("../../models/category");
const { generateCategoryID,generateProductID } = require("../../utils/generateID");
const product = require("../../models/product");
const User = require("../../models/user");
const Org = require("../../models/Org");
module.exports = class Product {

  async createCategory({ req, catName, imageUrl }) {
    try {
      return await Category.findOne({ userId: req.session.userId }).then(
        async (category) => {
     if(category == null)   return { status: "error", message: "can't find user" };
         const getCat = category.catList.length > 0 ? await category.catList.filter(
            (c) => c.name == catName
          ) : 0
          if (getCat.length > 0) {
            return { status: "error", message: "Category already exists" };
          }

          category.catList.push({
            name: catName,
            catId: await generateCategoryID(),
            catImageUrl:
              imageUrl == undefined || imageUrl == "" ? "" : imageUrl,
            online: imageUrl == undefined || imageUrl == "" ? false : true,
            // parent: parentId == "" ? false : true,
            // parentId: parentId == "" ? undefined : parentId,
          });
          await category.save();
          return { status: "success", message: "Category added successfully" };
        }
      );
    } catch (error) {
      throw error;
    }
  }


  async getCategory({ req }) {
    try {
      return await Category.findOne({ userId: req.session.userId })
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


  async createProduct({
    req,
    type,
    name,
    categoryId,
    barcode,
    stackQty,
    erpPrice,
    ePrice,
    unit,
    description,
    erpTax,
    erpTaxRate,
    eTax,
    eTaxRate,
    erpActive,
    eActive,
    eStore,
    eImage,
    eProductImg,
    eProductVideo,
    eSellingPrice,
    eDiscountPrice,
    eDiscount
  }) {
    try {
     
      const getproduct = await product.findOne({
        userId: req.session.userId,
        name,
        type,
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
          type,
          name,
          productId: await generateProductID(),
          userId: req.session.userId,
          orgId: req.session.orgId,
          categoryId: categoryId == "" ? undefined : categoryId,
          barcode,
          stackQty,
          erpPrice,
          ePrice: eStore ? ePrice : undefined,
          unit,
          description: eStore ? description : undefined,
          erpTax: org.GSTPin ? erpTax : undefined,
          erpTaxRate: org.GSTPin ? erpTaxRate : undefined,
          eTax: eStore && org.GSTPin ? eTax : undefined,
          eTaxRate: eStore && org.GSTPin ? eTaxRate : undefined,
          erpActive,
          eSellingPrice: eStore ? eSellingPrice : undefined,
          eDiscount:eStore ? eDiscount : undefined,
          eActive: eStore ? eActive : undefined,
          eStore: eStore == undefined ?  false : eStore,
          eImage: eStore ? eImage : undefined,
          eProductImg: eStore ? eProductImg : undefined,
          eProductVideo: eStore ? eProductVideo : undefined,
        })
        .then(async (createProductResponse) => {
         // await createProductResponse.save();
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
        
      return await product.find({ userId: req.session.userId })
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
 async productActive ({req,productId}){
    try {
       return await product.findOne({productId,userId: req.session.userId})
        .then(async(product) => { 
            product.erpActive =!product.erpActive;
           await product.save();
            return {
                status: "success",
                message: "ERP Product active status changed successfully",
            };
        })
        .catch((error) => {
            console.log(error);
            return { status: "error", message: "Product active status changed failed"};
        })
    } catch (error) {
        return { status: "error", message: "something went wrong"}
    }
 }
};
