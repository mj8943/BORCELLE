const session = require("express-session");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
const Message = require("../models/messageModel");
const Banner = require("../models/bannerModel");

// referral code generating
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateUniqueReferralCode() {
  let uniqueCode;
  let codeExists = true;

  while (codeExists) {
    uniqueCode = generateReferralCode();

    const existingUser = await User.findOne({ referralCode: uniqueCode });
    if (!existingUser) {
      codeExists = false;
    }
  }

  return uniqueCode;
}

const loadRegister = async (req, res) => {
  try {
    console.log("registration query", req.query);
    req.session.ref = req.query.ref;
    res.render("users/registration");
  } catch (error) {
    console.log("error on loadRegister");
    res.render("/error");
  }
};

const secuaredPassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log("password hashing error", error.message);
  }
};

function generateOtp() {
  return otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
}

// verification mail sending
const sendMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "minhajmazah@gmail.com",
        pass: "kzec ujte nfvh edxg",
      },
    });
    const mailOptions = {
      from: "minhajmazah@gmail.com",
      to: email,
      subject: "OTP verification",
      text: `Hiii ${name} your OTP is: ${otp}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("otp verification failed", error);
      } else {
        if (info && info.response) {
          console.log("email sent", info.response);
        } else {
          console.log(
            "Email send successfully, but info or info.response is undefined."
          );
        }
      }
    });
  } catch (error) {
    console.log("sendMail is not working", error.message);
  }
};

const insertData = async (req, res) => {
  try {
    const spassword = await secuaredPassword(req.body.password);
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: spassword,
      mobile: req.body.mobile,
    };
    req.session.user = user;
    console.log("session data", req.session.user);
    const otp = generateOtp();
    req.session.otp = otp;
    if (req.session.user) {
      sendMail(req.session.user.name, req.session.user.email, req.session.otp);
      console.log("data passed for mail");
      res.redirect("/otp-verify");
    } else {
      res.render("users/registration", {
        message: "Your registration has been failed",
      });
    }
  } catch (error) {
    console.log("insertData error", error);
  }
};

const loadOtp = async (req, res) => {
  try {
    res.render("users/verify");
  } catch (error) {
    console.log("Otp page is not loading", error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const otp = generateOtp();
    req.session.otp = otp;
    if (req.session.otp) {
      sendMail(req.session.user.name, req.session.user.email, req.session.otp);
      console.log("otp resend function worked");
    }
  } catch (error) {
    console.log("resend otp is not working", error);
  }
};

// checking otp is matching or not
const verfyOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp;
    const storedOtp = req.session.otp;
    const userEmail = req.session.user.email;
    const referralCode = await generateUniqueReferralCode();
    console.log(enteredOtp, storedOtp, userEmail, "in verifyOtp");

    const userInfo = new User({
      name: req.session.user.name,
      email: req.session.user.email,
      password: req.session.user.password,
      mobile: req.session.user.mobile,
      referralCode,
    });
    console.log("session", userInfo);
    if (!userInfo) {
      console.log("User not found in verifyOtp");
      return res.render("users/verify", { message: "User not found" });
    }
    console.log(typeof enteredOtp);
    console.log(typeof storedOtp);
    if (enteredOtp === storedOtp) {
      console.log("entered after verify otp");
      await userInfo.save();

      const wallet = new Wallet({
        userId: userInfo._id,
      });

      await wallet.save();

      // referral transactions
      const ref = req.session.ref;

      if (ref) {
        await handleRefferal(ref, userInfo._id);
      }

      req.session.user._id = userInfo._id;
      console.log("req.session.user.id in register", req.session.user.id);
      console.log("OTP matched");
      res.redirect("/");
    } else {
      res.render("users/verify", { message: "OTP not matching" });
      console.log("OTP matching error");
    }
  } catch (error) {
    console.log("verfyOtp has an error", error.messsage);
  }
};

async function handleRefferal(referralCode, userId) {
  try {
    console.log("referralCode, userId");
    console.log(referralCode, userId);
    if (!referralCode) {
      return;
    }

    const referrer = await User.findOne({ referralCode: referralCode });
    console.log(referrer);
    if (!referrer) {
      return;
    }

    console.log(referrer._id);
    console.log(typeof referrer._id);
    console.log(userId);
    console.log(typeof userId);

    const referrerTransaction = {
      Reason: "Referral reward for referring a new user",
      transaction: "Credited",
      amount: 100,
      date: new Date(),
    };

    const refereeTransaction = {
      Reason: "Referral bonus for signing up using a referral link",
      transaction: "Credited",
      amount: 50,
      date: new Date(),
    };

    console.log("Updating referrer's wallet...");
    let referrerId = referrer._id;
    console.log(referrerId);
    const referrerWallet = await Wallet.findOne({ userId: referrerId });
    console.log(referrerWallet);
    referrerWallet.history.push(referrerTransaction);
    referrerWallet.balance += 100;

    await referrerWallet.save();

    const refereeWallet = await Wallet.findOne({ userId: userId });
    console.log(refereeWallet);
    refereeWallet.history.push(refereeTransaction);
    refereeWallet.balance += 50;

    await refereeWallet.save();
  } catch {
    console.log(error);
  }
}

//login page loading
const loadLogin = async (req, res) => {
  try {
    res.render("users/login", { message: "" });
  } catch (error) {
    console.log("LoadLogin is not working", error.message);
  }
};

//login verification
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("email in vlogin", email);
    const password = req.body.password;
    console.log("password in verlogin", password);
    //checking email is matching
    const userData = await User.findOne({ email: email });

    if (!userData || userData.is_admin == 1) {
      return res.render("users/login", { message: "Invalid user" });
    }

    // password  matching
    const userPass = await bcrypt.compare(password, userData.password);
    if (!userPass) {
      return res.render("users/login", { message: "Invalid user" });
    }

    // checking user is blocked
    if (userData.is_blocked === true) {
      return res.render("users/login", {
        message: "Can not login to the site",
      });
    }

    //if every condition is ok
    req.session.user = userData;
    req.session.user.id = userData._id;
    console.log("success");
    res.redirect("/");
  } catch (error) {
    console.log("verifyLogin error", error.message);
  }
};

//forgot password
const loadForgot = async (req, res) => {
  try {
    res.render("users/forgotPassword");
    console.log("forgot password is loaded");
  } catch (error) {
    console.log("Forgort password page is not working in loadForgot");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const userEmail = req.body.email;
    const enteredOtp = req.body.enteredOtp;
    console.log("enteredOtp", enteredOtp);
    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        otp = generateOtp();
        sendMail(user.name, userEmail, otp);
        return res.status(200).json({ message: "User found", user: user });
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    }
    if (enteredOtp === otp) {
      console.log("User confirmed");
      return res.status(200).json({ message: "User confirmed" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

const forgotConfirm = async (req, res) => {
  try {
    const email = req.query.email;
    res.render("users/forgotConfirm", { email });
  } catch (error) {
    console.log("error on loading forgot confirm");
  }
};

const forgotChanging = async (req, res) => {
  try {
    console.log("forgotChanging");
    console.log(req.body.email);
    const { email, newPass, conPass } = req.body;
    if (req.body) {
      console.log("req.body");
      const user = await User.findOne({ email: email });
      if (newPass == conPass && user) {
        console.log("securepass");
        const spassword = await secuaredPassword(newPass);
        user.password = spassword;
        await user.save();
        console.log("pass save");
        console.log("password saved");
        return res
          .status(200)
          .json({ success: true, message: "Password changed successfully" });
      } else {
        console.log("otp not matching");
        return res
          .status(400)
          .json({
            success: false,
            message: "Passwords do not match or user not found",
          });
      }
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while changing password",
      });
  }
};

//home page loading
const loadHome = async (req, res) => {
  try {
    let name;
    let banners;
    if (req.session.user) {
      name = req.session.user.name;
    }
    banners = await Banner.find({ is_listed: true });

    res.render("home", { name, banners });
  } catch (error) {
    console.log("Home page error", error.message);
  }
};

// about us
const loadAbout = async (req, res) => {
  try {
    let name;
    if (req.session.user) {
      name = req.session.user.name;
    }
    res.render("about", { name });
    console.log("about page loaded");
  } catch (error) {
    console.log("about page not rendered");
  }
};

// blogs page
const loadBlogs = async (req, res) => {
  try {
    let name;
    if (req.session.user) {
      name = req.session.user.name;
    }
    res.render("blog", { name });
    console.log("blog page rendered");
  } catch (error) {
    console.log("blog page got error not rendered");
  }
};

//contact page
const loadContact = async (req, res) => {
  try {
    let name;
    if (req.session.user) {
      name = req.session.user.name;
    }
    res.render("contact", { name });
    console.log("contact page loaded");
  } catch (error) {
    console.log("error on contact page");
  }
};

const message = async (req, res) => {
  try {
    console.log("messages", req.body);
    const { name, email, message } = req.body;
    const messages = new Message({
      name: name,
      email: email,
      message: message,
    });

    await messages.save();
    console.log("Message saved");
  } catch (error) {
    console.log(error);
  }
};

// Shop page loading
const loadShop = async (req, res) => {
  try {
    const nameOfuser = req.session.user ? req.session.user.name : null;

    const { sort, minPrice, maxPrice, name: productName, id, move } = req.query;

    // Initialize page number and page size
    const pageSize = 6;
    let page = move ? parseInt(req.query.move) : 1;
    const skip = (page - 1) * pageSize;

    let pipeline = [
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "name",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "offers",
          localField: "discount",
          foreignField: "_id",
          as: "offer",
        },
      },
      { $match: { "category.is_listed": true, is_listed: true } },
    ];

    if (sort) {
      const sortOrder = sort === "Low" ? 1 : -1;
      pipeline.push({ $sort: { price: sortOrder } });
    }

    if (minPrice && maxPrice) {
      const minPriceNum = parseFloat(minPrice);
      const maxPriceNum = parseFloat(maxPrice);
      pipeline.push({
        $match: {
          price: { $gte: minPriceNum, $lte: maxPriceNum },
          is_listed: true,
        },
      });
    }

    if (productName) {
      pipeline.push({
        $match: { name: { $regex: productName, $options: "i" } },
      });
    }

    if (id) {
      const category = await Category.findById(id);
      const name = category.name;
      pipeline.unshift({ $match: { category: name } });
    }

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    let products = await Product.aggregate(pipeline);

    // Count total number of products matching the criteria
    const totalProductsCountPipeline = [...pipeline];
    totalProductsCountPipeline.splice(-2, 2); // Remove the $skip and $limit stages
    const totalProductsCount = await Product.aggregate([
      ...totalProductsCountPipeline,
      { $count: "count" },
    ]);
    const totalPages = Math.ceil(
      totalProductsCount.length > 0 ? totalProductsCount[0].count / pageSize : 0
    );

    const categorys = await Category.find({ is_listed: true });
    const noProducts = products.length === 0;

    console.log("totalPages in the shop page", totalPages);

    res.render("shops", {
      products,
      categorys,
      nameOfuser,
      noProducts,
      page,
      totalPages,
    });
  } catch (error) {
    console.log("Error in loadShop:", error);
    res.status(500).send("Internal Server Error");
  }
};

// product details
const productDetails = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(req.params.id);
    const product = await Product.find({ _id: id })
      .populate("discount")
      .populate("reviews.user");
    let reviews = product[0].reviews;
    let rating = 0;
    console.log(product);
    reviews.forEach((review) => {
      console.log(review.rating);
      rating += review.rating;
    });
    console.log(rating);

    console.log("product details page loaded");
    res.render("productDetails", { product });
  } catch (error) {
    console.log("productDetails got error", error);
  }
};

const userProfile = async (req, res) => {
  try {
    console.log("profile 1222");
    console.log("req.session.user", req.session.user);
    if (req.session.user) {
      const email = req.session.user.email;
      const user = await User.findOne({ email: email });
      console.log("user for profile", user);
      res.render("users/profile", { user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("error on userprofile rendering");
  }
};

const userOrders = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.session.user;
      console.log(id);
      const order = await Order.find({ userId: id })
        .populate("items.productId")
        .sort({ orderedDate: -1 });
      console.log("your orders:", order);
      res.render("users/orders", { order });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const userOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("items.productId");
    res.render("users/userOrderDetails", { order });
  } catch (error) {
    console.log("error on userOrderDetails", error);
  }
};

const userOrderStatus = async (req, res) => {
  try {
    console.log("userOrderStatus", req.body);
    const { orderId, action, itemId, reason } = req.body;
    console.log(orderId);

    const order = await Order.findById(orderId);
    console.log(order);

    // quantity adding
    const product = await Order.findOne(
      { _id: orderId, items: { $elemMatch: { _id: itemId } } },
      { "items.$": 1 }
    );
    console.log("product", product);
    const firstItem = product.items[0];

    const { productId, quantity, variant } = firstItem;

    console.log("Product ID:", productId);
    console.log("Quantity:", quantity);
    console.log("Variant:", variant);

    const updateQuery = {};
    updateQuery[`variant.${variant}`] = quantity;

    if (productId) {
      await Product.updateOne(
        { _id: productId },
        {
          $inc: updateQuery,
        }
      );
    }

    // status changing
    await Order.updateOne(
      { _id: orderId, "items._id": itemId },
      { $set: { "items.$.orderStatus": action } }
    );

    // wallet amount adding

    const userId = req.session.user._id;
    console.log("order.payment", order.payment);

    if (order.payment === "paypal" || order.payment === "wallet") {
      const product = await Order.findOne(
        { _id: orderId, items: { $elemMatch: { _id: itemId } } },
        { "items.$": 1 }
      );
      console.log("product for wallet", product);
      const productId = product.items[0].productId;
      
      const productData = await Product.findById(productId);
      const price = productData.price;
      const priceOrg =   product.items[0].quantity * price;

      await Wallet.updateOne({ userId: userId }, { $inc: { balance: price } });

      // Update wallet history with the reason
      await Wallet.updateOne(
        { userId: userId },
        {
          $push: {
            history: {
              Reason: reason,
              amount: priceOrg,
              transaction: "Credited",
              date: new Date(),
            },
          },
        }
      );

      console.log("amount added to wallet");
    }

    res
      .status(200)
      .json({ success: true, message: "Order status updated successfully." });
  } catch (error) {
    console.error("Error on order cancel and return:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update order status." });
  }
};

const userAddresses = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.session.user;
      const user = await User.findById(id);
      res.render("users/address", { user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const userProfileAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    console.log("the user addadd:", user);
    console.log("addressBody", req.body);
    if (req.body.addressId) {
      const addressId = req.body.addressId;

      const { fullname, mobile, pincode, city, state, house_no, area } =
        req.body;
      console.log("stratd");

      await User.updateOne(
        { _id: userId, "address._id": addressId },
        {
          $set: {
            "address.$.fullname": fullname,
            "address.$.mobile": mobile,
            "address.$.pincode": pincode,
            "address.$.city": city,
            "address.$.state": state,
            "address.$.house_no": house_no,
            "address.$.area": area,
          },
        }
      );
      res.redirect("/user-address");
    } else if (req.body && user) {
      const addressInfo = {
        fullname: req.body.fullname,
        mobile: req.body.mobile,
        pincode: req.body.pincode,
        city: req.body.city,
        state: req.body.state,
        house_no: req.body.house_no,
        area: req.body.area,
      };
      await User.updateOne(
        { _id: userId },
        {
          $push: { address: addressInfo },
        }
      );
      console.log("User new address saved");

      res.redirect("/user-address");
    }
  } catch (error) {
    console.log("Error on addAddress", error.message);
  }
};

const removeAddressProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId } = req.body;
    await User.updateOne(
      { _id: userId },
      { $pull: { address: { _id: addressId } } }
    );
    res.status(200).json({ message: "address deleted successfully" });
  } catch (error) {
    console.error("Error removing address:", error);
  }
};

const userPassword = async (req, res) => {
  try {
    res.render("users/password");
  } catch (error) {
    console.log(error);
  }
};

// password checking
const confirmPassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    console.log("this is changepassword", req.body);
    const { oldPass, newPass, conPass } = req.body;
    const password = user.password;
    console.log(password);
    const userPass = await bcrypt.compare(oldPass, password);
    if (userPass) {
      if (newPass == conPass) {
        const spassword = await secuaredPassword(newPass);
        user.password = spassword;
        await user.save();
        console.log("Password changed successfully");
        return res.status(200).json({ success: true, message: "Password changed successfully" });

      } else {
        console.log("New password is not matching");
        return res.status(400).json({ success: false, message: "New password is not matching" });   
      }
    } else {
      console.log("You entered incorrept password");
      return res.status(400).json({ success: false, message: "You entered incorrect password" });
    }
  } catch (error) {
    console.log("error on change password");
  }
};

const userWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;
    let wallet = await Wallet.findOne({ userId: userId }).populate("userId");

    if (!wallet) {
      wallet = await Wallet.findOneAndUpdate(
        { userId: userId },
        { $setOnInsert: { userId: userId, balance: 0 } },
        { upsert: true, new: true }
      ).populate("userId");
    }

    // Sort the history array in descending order of date
    wallet.history.sort((a, b) => b.date - a.date);
    // Limit the history to maximum 5 entries
    const limitedHistory = wallet.history.slice(0, 5);

    res.render("users/wallet", { wallet: wallet, history: limitedHistory });
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    res.redirect("/");
    req.session.destroy();
  } catch (error) {
    console.log("error on profile logout");
  }
};

const productReview = async (req, res) => {
  try {
    console.log("review saving");
    console.log(req.body);
    const { rating, description, productId } = req.body;
    const userId = req.session.user._id;
    console.log(userId);

    const review = {
      user: userId,
      rating: parseInt(rating),
      date: new Date(),
      description: description,
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $push: { reviews: review },
      },
      { new: true }
    );
    res.redirect("/user-orders");

    console.log("Product updated:");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadRegister,
  insertData,
  loadOtp,
  verfyOtp,
  resendOtp,

  loadLogin,
  verifyLogin,
  loadForgot,
  forgotPassword,
  forgotConfirm,
  forgotChanging,

  loadHome,
  loadAbout,
  loadBlogs,
  loadShop,
  loadContact,

  message,

  productDetails,
  userProfile,
  userOrders,
  userOrderDetails,
  userOrderStatus,
  userAddresses,
  userProfileAddress,
  removeAddressProfile,
  userPassword,
  confirmPassword,
  userWallet,
  logout,

  productReview,
};
