const router = require("express").Router();

const validator = require("email-validator");

module.exports = ({ passport, services, log }) => {
  router.post("/create-category", async (req, res) => {
    try {
      const { imageUrl, catName } = req.body;
      await services.product
        .createCategory({ req, catName, imageUrl })
        .then((response) => {
          return res.json(response);
        });
    } catch (error) {
      throw error;
    }
  });

  router.get("/get-category", async (req, res) => {
    try {
      await services.product
        .getCategory({ req })
        .then((getCategoryResponse) => {
          return res.json(getCategoryResponse);
        })
        .catch((error) => {
          return res.json({ status: "error", message: "something went wrong" });
        });
    } catch (error) {
      throw error;
    }
  });

  router.post("/create-product", async (req, res) => {
    try {
      await services.product
        .createProduct({ body: req.body, req })
        .then((createProductResponse) => res.json(createProductResponse))
        .catch((error) => {
          console.log(error);
          return res.json({ status: "error", message: "something went wrong" });
        });
    } catch (error) {
      throw error;
    }
  });

  router.post("/create-category-child", async (req, res) => {
    try {
      const { parentId, imageUrl, catName } = req.body;
      await services.product
        .createCategoryChild({ req, catName, parentId, imageUrl })
        .then((response) => {
          return res.json(response);
        });
    } catch (error) {
      throw error;
    }
  });

  router.get("/get-all-products", (req, res) => {
    try {
      services.product
        .getAllProducts({ req })
        .then((getAllProductsResponse) => {
          return res.json(getAllProductsResponse);
        })
        .catch((error) => {
          return res.json({ status: "error", message: "Something Went Wrong" });
        });
    } catch (error) {
      throw error;
    }
  });
  router.post("/productCountForInvoice", async (req, res) => {
    
    await services.product.isCallProductQuantity({
      req,
      res,
    });
  });
  router.post("/product-active", async (req, res) => {
    try {
      req.body.req = req;
      await services.product
        .productActive(req.body)
        .then((responseProductActive) => res.json(responseProductActive))
        .catch((error) => {
          return res.json({ status: "error", message: "Something went wrong" });
        });
    } catch (error) {
      throw error;
    }
  });

  return router;
};
