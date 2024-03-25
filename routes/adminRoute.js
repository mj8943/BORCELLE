const express = require("express");
const admin_route = express();
const multer = require('multer');
const adminController = require("../controller/adminController");

const { islogin, isLogout} = require('../middleware/authAdmin');

const { uploadProductImages, uploadBannerImage } = require('../middleware/multerConfig');

// login
admin_route.get('/',isLogout,adminController.loadAdmin);
admin_route.post('/',adminController.verifyAdmin);

admin_route.get('/logout',islogin,adminController.adminLogout)

// dashboard
admin_route.get('/dashboard',islogin,adminController.loadDashboard);
admin_route.get('/dashboard-data',islogin,adminController.sendDashboardData);
admin_route.post('/dashboard/sales-report',islogin, adminController.salesReport);


// user management
admin_route.get('/users-list',islogin,adminController.usersLoad);
admin_route.post('/block-user',islogin,adminController.userBlock);
admin_route.post('/unBlock-user',islogin,adminController.userUnblock);

// product management
admin_route.get('/products',islogin,adminController.productLoad);
admin_route.get('/add_product',islogin,adminController.addProduct);
admin_route.post('/add_product', islogin, uploadProductImages, adminController.productAdded);
admin_route.post('/unlist-product',islogin,adminController.productUnlist);
admin_route.post('/list-product',islogin,adminController.productList);
admin_route.get('/edit-product/:id',islogin,adminController.editProduct);
admin_route.post('/add_product', islogin, uploadProductImages, adminController.productAdded);

// category management
admin_route.get('/categories',islogin,adminController.categoryLoad);
admin_route.post('/unlist-category',islogin,adminController.categoryUnlist);
admin_route.post('/list-category',islogin,adminController.categoryList);
admin_route.get('/add_category',islogin,adminController.addCategory);// page rendering
admin_route.post('/add_category',adminController.categoryAdded);
admin_route.get('/edit-category',islogin,adminController.editCategoryPage);// page rendering
admin_route.post('/edit-category',islogin,adminController.updateCategory);

// order management 
admin_route.get('/orders',islogin,adminController.userOrders);
admin_route.get('/order-details',islogin,adminController.orderDetails);
admin_route.post('/order-details',islogin,adminController.orderStatus);

// coupon management
admin_route.get('/product-coupon',islogin,adminController.productCoupon);
admin_route.get('/product-coupon/add-coupon',islogin,adminController.addCoupon);
admin_route.post('/product-coupon/add-coupon',islogin,adminController.couponAdding);
admin_route.delete('/product-coupon',islogin,adminController.couponDelete);
admin_route.get('/product-coupon/edit-coupon',islogin,adminController.editCoupon);
admin_route.post('/product-coupon/edit-coupon',islogin,adminController.couponEdit);

// offer management
admin_route.get('/product-offer',islogin,adminController.productOffer);
admin_route.get('/product-offer/add-offer',islogin,adminController.addOffer);
admin_route.post('/product-offer/add-offer',islogin,adminController.newOffer);
admin_route.post('/offer-apply',islogin,adminController.productOfferApply);
admin_route.post('/remove-offer',islogin,adminController.productOfferRemove);
admin_route.delete('/product-offer',islogin,adminController.deleteOffer);
admin_route.post('/category-offer',islogin,adminController.categoryOfferApply);

//banner management
admin_route.get('/banners',islogin,adminController.bannerPage);
admin_route.get('/add-banner',islogin,adminController.addBanner);
admin_route.post('/add-banner', islogin, uploadBannerImage, adminController.newBanner);
admin_route.delete('/delete-banner',islogin,adminController.deleteBanner);
admin_route.post('/unlist-banner',islogin,adminController.unlistBanner);
admin_route.post('/list-banner',islogin,adminController.bannerList);


module.exports = admin_route;