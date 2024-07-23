const router = require('express').Router();
const ProductRouter = require('./product/route');
const userRouter = require('./user/route')
const CustomerRouter = require('./customer/route')
const VendorRouter = require('./vendor/route')
const InvoiceRouter = require('./invoice/route')
const PurchaseRouter = require('./purchase/route')
const PaymentRouter = require('./payment/route')
module.exports = (props)=>{
    router.use('/user', userRouter(props));
    router.use('/product',ProductRouter(props));
    router.use('/customer',CustomerRouter(props))
    router.use('/vendor',VendorRouter(props))
    router.use('/invoice',InvoiceRouter(props))
    router.use("/payment",PaymentRouter(props))
    router.use("/purchase",PurchaseRouter(props))
    return router
}
