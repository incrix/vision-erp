// exports.addQuantityThroughIndex = async ({
//   productList,
//   index,
//   list,
//   clientCount,
//   type,
//   resolve,
//   reject,
// }) => {
//   try {
//     if (productList[list[index].productIndex].isSales == false)
//       return reject({
//         status: "error",
//         message: "Can't add product while product status false",
//       });
//     productList[list[index].productIndex].stockQty =
//       type == "invoice"
//         ? await countProductForInvoice(
//             productList[list[index].productIndex].stockQty,
//             list[index].quantity * clientCount
//           )
//         : countProductForPurchase(
//             productList[list[index].productIndex].stockQty,
//             list[index].quantity * clientCount
//           );
//     await productList[list[index].productIndex].save();
//     return resolve({
//       status: "success",
//       message: `Product saved successfully for ${
//         productList[list[index].productIndex].productId
//       }`,
//     });
//   } catch (error) {
//     return reject({ status: "error", message: error.message });
//   }
// };

// exports.addQuantityThroughLoop = async ({
//   productList,
//   index,
//   list,
//   clientCount,
//   type,
//   resolve,
//   reject,
// }) => {
//   try {
//     const getProductIndex = productList
//       .map(function (item) {
//         return item.productId;
//       })
//       .indexOf(list[index].productId);

//     if (getProductIndex < 0)
//       return reject({
//         status: "error",
//         message: `can't find ${list[index].name} product`,
//       });
//     if (productList[getProductIndex].isSales == false)
//       return reject({
//         status: "error",
//         message: "Can't add product while product status false",
//       });

//     productList[getProductIndex].stockQty =
//       type == "invoice"
//         ? await countProductForInvoice(
//             productList[getProductIndex].stockQty,
//             list[index].quantity * clientCount
//           )
//         : countProductForPurchase(
//             productList[getProductIndex].stockQty,
//             list[index].quantity * clientCount
//           );
//     await productList[getProductIndex].save();

//     return resolve({
//       status: "success",
//       message: `Product saved successfully for ${productList[getProductIndex].productId}`,
//     });
//   } catch (error) {
//     console.log(error);
//     return reject({ status: "error", message: error.message });
//   }
// };

// const countProductForInvoice = (stockQty, quantity) => {
//   if (stockQty > 0) {
//     return stockQty - quantity;
//   }
//   return stockQty - quantity;
// };

// const countProductForPurchase = (stockQty, quantity) => {
//   if (stockQty > 0) {
//     return stockQty + quantity;
//   }
//   return stockQty + quantity;
// };


