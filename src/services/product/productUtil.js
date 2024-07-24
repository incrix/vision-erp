exports.addQuantityThroughIndex = async ({
  productList,
  index,
  list,
  resolve,
  reject,
}) => {
  try {
    productList[list[index].productIndex].stockQty = await countProduct(
      productList[list[index].productIndex].stockQty,
      list[index].quantity
    );
    await productList[list[index].productIndex].save();
    return resolve({
      status: "success",
      message: `Product saved successfully for ${
        productList[list[index].productIndex].productId
      }`,
    });
  } catch (error) {
    return reject({ status: "error", message: error.message });
  }
};

exports.addQuantityThroughLoop = async ({
  productList,
  index,
  list,
  resolve,
  reject,
}) => {
  try {
    const getProductIndex = productList
      .map(function (item) {
        return item.productId;
      })
      .indexOf(list[index].productId);

    if (getProductIndex < 0)
      return reject({
        status: "error",
        message: `can't find ${list[index].name} product`,
      });
      productList[getProductIndex].stockQty = await countProduct(
        productList[getProductIndex].stockQty,
        list[index].quantity
      );
      await productList[getProductIndex].save();
  
    return resolve({
      status: "success",
      message: `Product saved successfully for ${productList[getProductIndex].productId}`,
    });
  } catch (error) {
    console.log(error);
    return reject({ status: "error", message: error.message });
  }
};

const countProduct = (stockQty, quantity) => {
  if (stockQty > 0) {
    return stockQty - quantity;
  }
  return stockQty - quantity;
};
