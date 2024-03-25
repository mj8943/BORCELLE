const session = require("express-session");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Wallet = require("../models/walletModel");
const Coupon = require("../models/couponModel");
const Category = require("../models/categoryModel");

const { createInvoice } = require("../utils/createInvoice");

const checkout = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userMail = req.session.user.email;
    console.log("userId in cart is:", userId);
    const user = await User.findOne({ email: userMail });
    console.log("for checkout", user);
    console.log("checking for checkout", user.address);
    const products = await Cart.findOne({ userId: userId })
      .populate("items.productId")
      .populate("userId");
    console.log("products");
    console.log(products);

    for (let product of products.items) {
      console.log("product in for");
      console.log(product);
      console.log(product.productId.is_listed);
      if (!product.productId.is_listed) {
        return res
          .status(400)
          .json({
            message: "This product not available please remove and proceed !!",
          });
      }
      console.log("product listed")
      let categoryName = product.productId.category;
      let category = await Category.findOne({ name: categoryName });
      console.log("categories");
      console.log(categoryName);
      console.log(category);
      if (!category.is_listed) {
        return res
        .status(400)
        .json({
          message:
          "This category product not available please remove and proceed !!",
        });
      }
      console.log("category listed")
      let cartVariant = product.variant;
      let cartQuantity = product.quantity;

      console.log(cartVariant)
      console.log(cartQuantity)
      console.log(product.productId.variant[cartVariant])

      if (product.productId.variant[cartVariant] < cartQuantity) {
        return res
          .status(400)
          .json({ message: "Product Stocks not availabe now" });
      }
    }

    res.status(200).json({ message: "Checkout page render" });
    console.log("checkout-pre checking done");
  } catch (error) {
    console.log("error on checkout rendering ", error.message);
  }
};

const checkoutRender = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userMail = req.session.user.email;
    console.log("userId in cart is:", userId);
    const user = await User.findOne({ email: userMail });
    console.log("for checkout", user);
    console.log("checking for checkout", user.address);
    const products = await Cart.findOne({ userId: userId })
      .populate("items.productId")
      .populate("userId");
    console.log("products");
    let coupon = null;
    if (req.query.coupon) {
      const code = req.query.coupon;
      coupon = await Coupon.findOne({ couponCode: code });
    }

    res.render("checkout", { products, user, coupon });
    console.log("checkout page rendered");
  } catch (error) {
    console.log("error on checkout rendering ", error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    console.log("the user addadd:", user);
    console.log(req.body);
    if (req.body && user) {
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

      res.redirect("/check-out");
    }
  } catch (error) {
    console.log("Error on addAddress", error.message);
    res.status(500).send("Internal Server Error");
  }
};

const orderPlace = async (req, res) => {
  try {
    console.log("placing info", req.body);
    const { addressId, paymentMethod, totalPrice, coupon } = req.body;
    console.log("coupon", coupon);
    console.log(paymentMethod);
    console.log("totalPrice in order place ", totalPrice);
    const userId = req.session.user;
    const user = await User.findById(userId);

    let finalTotalPrice = totalPrice;

    if (paymentMethod == "COD" && totalPrice > 1000) {
      console.log("COD is not work for total < 1000");
      res.status(400).json({
        success: false,
        message: "COD not work for more than Rs.1000 !!!.",
      });
      return;
    }

    // wallet checking
    if (paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ userId: userId });
      const walletMoney = wallet.balance;
      console.log("wallet balance for payment", walletMoney);

      if (walletMoney < finalTotalPrice) {
        console.log("insufficient");
        res
          .status(400)
          .json({ success: false, message: "Insufficient balance in wallet." });
        return;
      }

      const finalWalletBalance = walletMoney - finalTotalPrice;

      await Wallet.updateOne(
        { userId: userId },
        {
          $set: { balance: finalWalletBalance },
          $push: {
            history: {
              amount: finalTotalPrice,
              transaction: "Debited",
              date: new Date(),
            },
          },
        }
      );
    }

    const selectedAddress = user.address.find(
      (address) => address._id.toString() === addressId
    );
    console.log("address founded", selectedAddress);

    const cart = await Cart.findOne({ userId: userId });
    console.log("items in the cart", cart.items);

    const items = cart.items;

    for (const item of items) {
      const productId = item.productId;
      const variantOfOrderedProduct = item.variant;
      const qtyOfOrderedProduct = item.quantity;
      console.log(
        "Product ID:",
        productId,
        "Variant:",
        variantOfOrderedProduct,
        "Quantity:",
        qtyOfOrderedProduct
      );

      const quantity = qtyOfOrderedProduct * -1;

      const updateQuery = {};
      updateQuery[`variant.${variantOfOrderedProduct}`] = quantity;

      await Product.updateOne(
        { _id: productId },
        {
          $inc: updateQuery,
        }
      );
    }

    const currentDate = new Date();
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() + 6);
    console.log("start");

    const newOrder = new Order({
      userId: userId,
      userAddress: selectedAddress,
      payment: paymentMethod,
      items: items,
      orderedDate: currentDate,
      expectedDate: expectedDate,
      orderStatus: "Pending",
      total: finalTotalPrice,
      coupon: coupon,
    });

    await newOrder.save();
    console.log("order saved in the collection");

    cart.items = [];
    await cart.save();
    console.log("Cart is empty now");

    res.json({ success: true, redirect: "/greet" });
  } catch (error) {
    console.log("error on placing order", error);
    res.status(500).json({ success: false, message: "Error placing order." });
  }
};

const greet = async (req, res) => {
  try {
    res.render("greeting");
    console.log("congratulation");
  } catch (error) {}
};

// product invoice
const invoice = async (req, res) => {
  try {
    console.log("invoice");
    const { id } = req.params;
    console.log(id);

    const orderDoc = await Order.findById(id);
    console.log(orderDoc);
    let items = [];
    orderDoc.items.forEach((item) => {});
    let subtotal;
    let paid = 0;
    if (orderDoc) {
      paid = orderDoc.total * 100;
    }

    const invoice = {
      shipping: {
        name: orderDoc.userAddress.fullname,
        city: orderDoc.userAddress.city,
        state: orderDoc.userAddress.state,
        country: "India",
        postal_code: orderDoc.userAddress.pincode,
      },
      items: items,
      subtotal: orderDoc.total * 100,
      paid,
      coupon: {
        code: orderDoc?.coupon?.code || "none",
        value: orderDoc?.coupon?.discountAmount * 100 || 0,
      },
      Order_nr: orderDoc.userAddress.mobile,
    };

    const generatedPDF = createInvoice(invoice);
    console.log("pdf generated");

    // Set the appropriate headers for PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="example.pdf"');

    // Send the generated PDF buffer as a response
    generatedPDF.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  checkout,
  checkoutRender,
  addAddress,
  orderPlace,
  greet,
  invoice,
};
