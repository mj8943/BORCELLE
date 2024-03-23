const session = require("express-session");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");

const productCart = async (req, res) => {
  try {
    console.log("product cart user:", req.session.user);
    if (req.session.user) {
      const userId = req.session.user._id;

      const userMail = req.session.user.email;
      const user = await User.findOne({ email: userMail });
      console.log("userId in cart is:", userId);
      const coupon = await Coupon.find({});
      const products = await Cart.findOne({ userId: userId })
        .populate("items.productId")
        .populate("userId");
        console.log(products);
      res.render("shopingCart", { products, user, coupon });
      console.log("add to cart page renderd");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("error on productCart", error.message);
  }
};



const productInfo = async (req, res) => {
  try {
    if (!req.session.user) {
      console.log("nnnnn");
      return res.status(401).json({ error: "Please login !!" });
    }
    console.log("Reached the add to cart method");
    const userEmail = req.session.user;
    const user = await User.findOne({ email: userEmail.email });
    console.log("User: ", user);
    const userId = user._id;
    console.log("For cart: ", userId);


    if (req.body && req.body.productId && req.body.variant) {
      const productId = req.body.productId;
      const productVariant = req.body.variant;
      console.log("ProductId is: ", productId);
      console.log("Variant is: ", productVariant);
      console.log("Entered to saving");

      // If the given userId already exists
      let existingCart = await Cart.findOne({ userId: userId });
      console.log("Cart:", existingCart);

      

      console.log("existingCart")
      console.log(existingCart)

      if (existingCart) {
        console.log("cart nddd");
        const existingCartItem = existingCart.items.find(
          (item) =>
            item.productId.equals(productId) && item.variant === productVariant
        );

        if (!existingCartItem) {
          console.log("user dont have cart item");

          await Cart.updateOne(
            { userId: userId },
            {
              $push: {
                items: {
                  productId: productId,
                  variant: productVariant,
                  quantity: 1,
                },
              },
            }
          );
          console.log("ProductId saved to the existing cart");
          res.json({ message: "added to cart" });
        } else {
          res.json({
            message: "Product with the same variant is already in the cart",
          });
        }
      } else {
        // If the user doesn't have a cart, create a new cart
        const newCart = new Cart({
          userId: userId,
          items: [
            { productId: productId, variant: productVariant, quantity: 1 },
          ],
        });
        await newCart.save();
        console.log("New cart created and productId saved");
        res.status(200).json({ message: "added to cart" });
      }
    } else {
      console.log("Missing productId or variant in the request body");
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log("Duplicate key error: userId already exists");
    } else {
      console.log("Error in productInfo of cart:", error.message);
    }
  }
};

const cartQuantity = async (req, res) => {
  try {
    console.log("updating quantity");

    const userEmail = req.session.user;

    const user = await User.findOne({ email: userEmail.email });
    console.log("product info", user);

    const userId = user._id;
    console.log("for cart", userId);

    const { itemId, change } = req.body;

    const item = await Cart.findOne(
      {
        userId: userId,
        "items._id": itemId,
      },
      {
        "items.$": 1,
      }
    );

    console.log("item" + item);

    const variant = item.items[0].variant;
    const cartQty = item.items[0].quantity;

    const product = await Product.findById(item.items[0].productId);
    const variantStock = product.variant[variant];

    // const userCart = await Cart.findOne({ userId: userId });
    console.log(cartQty, change);
    let newQty = cartQty + change;
    console.log(newQty);
    console.log(variantStock);
    if (newQty <= variantStock && newQty > 0) {
      const updation = await Cart.updateOne(
        { userId: userId, "items._id": itemId },
        { $set: { "items.$.quantity": newQty } }
      );
      console.log(updation);
    }

    res.json({ status: "ok", message: "updated" });
  } catch (error) {
    console.log("error on cartQuantity", error.message);
  }
};

const productRemove = async (req, res) => {
  try {
    console.log(req.body);
    console.log("remove product in cart");
    const userEmail = req.session.user.email;
    const itemId = req.body.itemId;
    const user = await User.findOne({ email: userEmail });
    console.log("user in remove", user);
    const userId = user._id;
    console.log(userId);

    const cart = await Cart.updateOne(
      { userId: userId },
      {
        $pull: { items: { _id: itemId, productId: { $ne: null } } },
      },
      { new: true }
    );
    if (cart.nModified === 0) {
      return res.status(404).json({ error: "Item not found in the cart." });
    }

    console.log("Product deleted from the cart");
    return res.status(200).json({ message: "Product deleted from the cart" });
  } catch (error) {
    console.log("productRemove error", error.message);
  }
};

module.exports = {
  productCart,
  productInfo,
  cartQuantity,
  productRemove,
};
