const express = require("express");
const user_route = express();

const userController = require ('../controller/userController');
const cartController = require ('../controller/cartController');
const orderController = require ('../controller/orderController');

// middleware
const { islogin, isLogout} = require('../middleware/authUser');


const { razorPayOrder, verifyPayment } = require("../controller/razorpay");

//Registration
user_route.get('/register',isLogout,userController.loadRegister);
user_route.post('/register',userController.insertData);
//OTP 
user_route.get('/otp-verify',userController.loadOtp);
user_route.post('/otp-verify',userController.verfyOtp);
user_route.post('/resend-otp',userController.resendOtp);
//login
user_route.get('/login',isLogout,userController.loadLogin);
user_route.post('/login',userController.verifyLogin);
//forgot password
user_route.get('/forgot-password',isLogout,userController.loadForgot)
user_route.post('/login-forgot-password',userController.forgotPassword); ////
user_route.get('/forgot-confirm',isLogout,userController.forgotConfirm)
user_route.post('/forgot-confirm',userController.forgotChanging); ////

// home
user_route.get('/',userController.loadHome);
// about page
user_route.get('/about',userController.loadAbout);
// blog page
user_route.get('/blog',userController.loadBlogs);
// contact page
user_route.get('/contact',userController.loadContact);
user_route.post('/contact',userController.message);

// shop page
user_route.get('/shops',userController.loadShop);
user_route.get('/product-details/:id',userController.productDetails);
//cart 
user_route.get('/shoping-cart',islogin,cartController.productCart);
user_route.post('/addToCart',cartController.productInfo);
user_route.post('/cart-quantity',islogin,cartController.cartQuantity);
user_route.delete('/remove-product',islogin,cartController.productRemove);
//checkout
user_route.get('/check-out',islogin,orderController.checkout);
user_route.post('/addaddress',islogin,orderController.addAddress);
user_route.post('/order-place',islogin,orderController.orderPlace);

user_route.get('/greet',islogin,orderController.greet);

// user profile 
user_route.get('/user-profile',islogin,userController.userProfile);
// user orders
user_route.get('/user-orders',islogin,userController.userOrders);
user_route.get('/user-order-details/:id',islogin,userController.userOrderDetails);
user_route.post('/order-details-status',islogin,userController.userOrderStatus);
user_route.post('/product-review',islogin,userController.productReview);
user_route.get("/invoice/:id", islogin, orderController.invoice);

// user addresses
user_route.get('/user-address',islogin,userController.userAddresses);
user_route.post('/addaddressProfile',islogin,userController.userProfileAddress);
user_route.post('/remove-address',islogin,userController.removeAddressProfile);
// user password
user_route.get('/user-password',islogin,userController.userPassword);
user_route.post('/user-password',islogin,userController.confirmPassword);

// user wallet
user_route.get('/user-wallet',islogin,userController.userWallet);

user_route.post('/logout',userController.logout);
// razorPay
user_route.post("/create/orderId", razorPayOrder);

user_route.post("/verify-payment",verifyPayment);

module.exports = user_route; 