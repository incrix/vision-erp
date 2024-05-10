const moment = require('moment-timezone');
exports.checkAuthenticated = (req, res, next) => {
  if (req.session.passport !== undefined) {
    return next();
  }

  res.redirect("/login");
};

exports.checkNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
};

exports.sessionExpire = (req, res, next) => {
  // get the date multiple unix value from 1000 
  // console.log(new Date(1709906417 * 1000));
  const date = new Date()

 if(req.session.expire){
  const now = moment(date);

  if(req.session.expire < now.unix()){
   req.session.destroy();
   return res.json({satus:'expire',message:'your session is expired',})
  }
  next();
 }
 else if(!req.session.expire){
  date.setMonth(date.getMonth() + 1)
  const now = moment(date);
  req.session.expire = now.unix();
  next();
 }
};

exports.userIsLogin = (req,res) =>{
try {
 // if(!req.session) return res.json({status:"error",isLogin:false,message:"user is not logged in"})
  const ref = req.header('Referer');
  //if(!req.session.userId) return req.session.destroy()
  // if(ref.split('/')[3] == '/setup' && !req.session.userId ) return res.json({status:"error",isLogin:false,message:"user is not logged in"})
  // if( req.session.isLogin && !req.session.fill_the_details) return res.json({status:"success",isLogin:true,fill_the_details:true,message:"user is not fill the details"})
  if(req.session.isLogin && !req.session.fill_the_details ) return res.json({status:"success",isLogin:true,fill_the_details:true,message:"user is logged in"})
   if(req.session.isLogin ) return res.json({status:"success",isLogin:true,message:"user is logged in"})

    return res.json({status:"error",isLogin:false,message:"user is not logged in"})
} catch (error) {
  res.json({ staus:'error',message:error.message})
}
}
