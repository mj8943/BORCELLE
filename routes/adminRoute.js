const express = require("express");
const admin_route = express();
const multer = require('multer');
const adminController = require("../controller/adminController");

const { islogin, isLogout} = require('../middleware/authAdmin');

// multer storage configuratioin
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/productImages'); 
    },
    filename: function (req, file, cb) {
      let ext=file.originalname.slice(file.originalname.lastIndexOf("."))
      cb(null, Date.now() + '-' + req.body.name+ext); 
    },
  });

  const upload = multer({ storage: storage });
  
  const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/bannerImages'); 
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-'); 
    },
  });

  const bannerUpload = multer({ storage: bannerStorage });

// login
admin_route.get('/',isLogout,adminController.loadAdmin);
admin_route.post('/',adminController.verifyAdmin);

admin_route.get('/logout',adminController.adminLogout)

// dashboard
admin_route.get('/dashboard',islogin,adminController.loadDashboard);
admin_route.get('/dashboard-data',islogin,adminController.sendDashboardData);
admin_route.post('/dashboard/sales-report', adminController.salesReport);


// user management
admin_route.get('/users-list',islogin,adminController.usersLoad);
admin_route.post('/block-user',adminController.userBlock);
admin_route.post('/unBlock-user',adminController.userUnblock);

// product management
admin_route.get('/products',islogin,adminController.productLoad);
admin_route.get('/add_product',islogin,adminController.addProduct);
admin_route.post('/add_product',upload.array('productImages',4),adminController.productAdded);
admin_route.post('/unlist-product',adminController.productUnlist);
admin_route.post('/list-product',adminController.productList);
admin_route.get('/edit-product/:id',islogin,adminController.editProduct);
admin_route.post('/edit-product',upload.array('productImages'),adminController.updateProduct);

// category management
admin_route.get('/categories',islogin,adminController.categoryLoad);
admin_route.post('/unlist-category',adminController.categoryUnlist);
admin_route.post('/list-category',adminController.categoryList);
admin_route.get('/add_category',islogin,adminController.addCategory);// page rendering
admin_route.post('/add_category',adminController.categoryAdded);
admin_route.get('/edit-category',islogin,adminController.editCategoryPage);// page rendering
admin_route.post('/edit-category',adminController.updateCategory);

// order management 
admin_route.get('/orders',islogin,adminController.userOrders);
admin_route.get('/order-details',islogin,adminController.orderDetails);
admin_route.post('/order-details',adminController.orderStatus);

// coupon management
admin_route.get('/product-coupon',islogin,adminController.productCoupon);
admin_route.get('/product-coupon/add-coupon',islogin,adminController.addCoupon);
admin_route.post('/product-coupon/add-coupon',adminController.couponAdding);
admin_route.delete('/product-coupon',adminController.couponDelete);
admin_route.get('/product-coupon/edit-coupon',islogin,adminController.editCoupon);
admin_route.post('/product-coupon/edit-coupon',adminController.couponEdit);

// offer management
admin_route.get('/product-offer',islogin,adminController.productOffer);
admin_route.get('/product-offer/add-offer',islogin,adminController.addOffer);
admin_route.post('/product-offer/add-offer',adminController.newOffer);
admin_route.post('/offer-apply',adminController.productOfferApply);
admin_route.post('/remove-offer',adminController.productOfferRemove);
admin_route.delete('/product-offer',adminController.deleteOffer);
admin_route.post('/category-offer',adminController.categoryOfferApply);

//banner management
admin_route.get('/banners',islogin,adminController.bannerPage);
admin_route.get('/add-banner',islogin,adminController.addBanner);
admin_route.post('/add-banner',bannerUpload.single('image'),adminController.newBanner);
admin_route.delete('/delete-banner',adminController.deleteBanner);
admin_route.post('/unlist-banner',adminController.unlistBanner);
admin_route.post('/list-banner',adminController.bannerList);


module.exports = admin_route;