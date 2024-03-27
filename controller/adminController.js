const session = require("express-session");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Offer = require("../models/offerModel");
const Banner = require("../models/bannerModel");

const loadAdmin = async (req, res) => {
  try {
    res.render("admins/login", { message: "" });
    console.log("Admin login loaded");
  } catch (error) {
    console.log("error on loading loadAdmin");
  }
};

const verifyAdmin = async (req, res) => {
  try {
    console.log("started");
    const enteredEmail = req.body.email;
    const enteredPass = req.body.password;
    console.log(enteredEmail);
    console.log(enteredPass);
    if (enteredEmail) {
      const adminInfo = await User.findOne({ email: enteredEmail });
      console.log("adminInfo got");

      if (adminInfo) {
        const storedPass = adminInfo.password;
        const passwordMatches = await bcrypt.compare(enteredPass, storedPass);
        if (adminInfo.is_admin == 1) {
          console.log("this is");
          if (passwordMatches) {
            console.log("now");
            console.log("Admin can login now");
            req.session.admin = adminInfo;
            res.redirect("admin/dashboard");
          } else {
            res.render("admins/login", {
              message: "Invalid email or password!",
            });
          }
        } else {
          res.render("admins/login", { message: "Not an admin, try again!" });
        }
      } else {
        res.render("admins/login", { message: "Not an admin, try again!" });
      }
    }
  } catch (error) {
    console.log("Error on verifyAdmin", error.message);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
    console.log("admin logout successfully");
  } catch (error) {
    console.log("admin cant logout");
  }
};

const loadDashboard = async (req, res) => {
  try {
    const totalUsers = await User.aggregate([
      { $match: { is_admin: 0 } },
      { $count: "customers" },
    ]);
    console.log("dashbrd user", totalUsers);

    const totalCount = totalUsers.length > 0 ? totalUsers[0].count : 0;

    console.log("users count", totalUsers);

    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: "$payment",
          total: { $sum: "$total" },
        },
      },
    ]);

    let paypalRevenue = 0;
    let codRevenue = 0;
    totalRevenue.forEach((item) => {
      if (item._id === "paypal") {
        paypalRevenue = item.total;
      } else if (item._id === "cod") {
        codRevenue = item.total;
      }
    });

    const totalAmount = paypalRevenue + codRevenue;
    const totalPercentage = totalAmount > 0 ? (totalAmount / 50000) * 100 : 0;

    const topSellingProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalQuantity: 1,
          productDetails: 1,
        },
      },
    ]);

    // const topSellingCategories = await Order.aggregate([
    //   { $unwind: "$items" },
    //   { $lookup: { from: "product", localField: "items.productId", foreignField: "_id", as: "product" } },
    //   { $unwind: "$product" },
    //   { $lookup: { from: "category", localField: "product.category", foreignField: "_id", as: "category" } },
    //   { $unwind: "$category" },
    //   {
    //     $group: {
    //       _id: "$category._id",
    //       categoryName: { $first: "$category.name" },
    //       totalQuantity: { $sum: "$items.quantity" }
    //     }
    //   },
    //   { $sort: { totalQuantity: -1 } },
    //   { $limit: 10 },
    // ]);

    console.log("datas top selling", topSellingProducts);

    res.render("admins/dashboard", {
      totalUsers: totalCount,
      paypalRevenue,
      codRevenue,
      totalPercentage,
      topSellingProducts,
      // topSellingCategories
    });
    console.log("dashboard loaded");
  } catch (error) {
    console.log("loadDashboard error", error.message);
  }
};

const sendDashboardData = async (req, res) => {
  try {
    console.log("entered");
    const totalUsers = await User.aggregate([
      { $match: { is_admin: 0 } },
      { $count: "customers" },
    ]);
    let customers = 0;
    if (totalUsers.length) {
      customers = totalUsers[0].customers;
      console.log(customers);
    }
    const { time } = req.query;

    let timeFrame = new Date(new Date().setHours(0, 0, 0, 0));
    let pipeline = [
      {
        $match: {
          orderedDate: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          orderCount: 1,
          label: "Today",
        },
      },
    ];

    if (time === "week") {
      timeFrame = new Date(
        new Date().setHours(0, 0, 0, 0) - new Date().getDay() * 86400000
      );

      pipeline = [
        {
          $match: {
            orderedDate: {
              $gte: new Date(
                new Date().setHours(0, 0, 0, 0) - new Date().getDay() * 86400000
              ),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$orderedDate" },
            totalAmount: { $sum: "$total" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            label: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                  { case: { $eq: ["$_id", 2] }, then: "Monday" },
                  { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                  { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                  { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                  { case: { $eq: ["$_id", 6] }, then: "Friday" },
                  { case: { $eq: ["$_id", 7] }, then: "Saturday" },
                ],
                default: "Unknown",
              },
            },
            totalAmount: 1,
            orderCount: 1,
          },
        },
        {
          $sort: { _id: 1 },
        },
      ];
    }

    if (time === "month") {
      timeFrame = new Date(new Date().getFullYear(), 0, 1);

      pipeline = [
        {
          $match: {
            orderedDate: {
              $gte: new Date(new Date().setDate(1)),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$orderedDate" },
            totalAmount: { $sum: "$total" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            label: {
              $dateToString: {
                format: "%B",
                date: {
                  $dateFromParts: {
                    year: new Date().getFullYear(),
                    month: "$_id",
                  },
                },
              },
            },
            totalAmount: 1,
            orderCount: 1,
          },
        },
        {
          $sort: { _id: 1 },
        },
      ];
    }

    if (time === "year") {
      const currentYear = new Date().getFullYear();
      const firstYear = currentYear - 4;

      timeFrame = new Date(firstYear, 0, 1);

      pipeline = [
        {
          $match: {
            orderedDate: {
              $gte: new Date(firstYear, 0, 1),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $group: {
            _id: { $year: "$orderedDate" },
            totalAmount: { $sum: "$total" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            label: "$_id",
            totalAmount: 1,
            orderCount: 1,
          },
        },
        {
          $sort: { label: 1 },
        },
      ];
    }

    // payment method
    const paymentMethods = await Order.aggregate([
      { $match: { orderedDate: { $gte: timeFrame } } },
      { $group: { _id: "$payment", orderCount: { $sum: 1 } } },
    ]);

    console.log("paymentMethods")
    console.log(paymentMethods)

    const payment = {
      paypal:
        paymentMethods.find(({ _id }) => _id == "paypal")?.orderCount ?? 0,
      cod: paymentMethods.find(({ _id }) => _id == "COD")?.orderCount ?? 0,
      wallet:paymentMethods.find(({ _id }) => _id == "wallet")?.orderCount ?? 0
    };

    // sales
    const salesDetails = await Order.aggregate(pipeline);

    const sales = {
      totalAmount: 0,
      orderCount: [],
      label: [],
    };
    // console.log(salesDetails);
    sales.totalAmount = salesDetails.reduce((acc, { totalAmount }) => {
      return acc + Number(totalAmount);
    }, 0);
    sales.orderCount = salesDetails.map(({ orderCount }) => orderCount);
    sales.label = salesDetails.map(({ label }) => label);

    res.status(200).json({
      status: "success",
      customers,
      payment,
      salesDetails,
      sales,
    });
  } catch (error) {
    // console.log(message.error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const salesReport = async (req, res) => {
  try {
    const { start, end } = req.body;
    console.log("Start date:", start);
    console.log("End date:", end);

    var startDate = new Date(start);
    var startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    var endDate = new Date(end);
    var endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.aggregate([
      {
        $match: {
          orderedDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);
    console.log("orders for download", orders);
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// users list
const usersLoad = async (req, res) => {
  try {
    console.log("users list loaded");
    const users = await User.find({ is_admin: 0 });
    res.render("admins/users", { users });
  } catch (error) {
    console.log("usersLoad got error", error.message);
  }
};

// blocking and unblocking user
const userBlock = async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      const userInfo = await User.findById(userId);
      if (!userInfo) {
        console.log("User not found in userBlock");
        return res.json({ success: false, message: "User not found" });
      }
      if (userInfo.is_blocked === false) {
        userInfo.is_blocked = true;
        await userInfo.save();
        return res.json({
          success: true,
          message: "User blocked successfully",
        });
      }
    }
  } catch (error) {
    console.log("userBlock is not working", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const userUnblock = async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      const userInfo = await User.findById(userId);
      if (!userInfo) {
        console.log("User not found in userUnblock");
        return res.json({ success: false, message: "User not found" });
      }
      if (userInfo.is_blocked === true) {
        userInfo.is_blocked = false;
        await userInfo.save();
        return res.json({
          success: true,
          message: "User unblocked successfully",
        });
      }
    }
  } catch (error) {
    console.log("userUnblock is not working", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//product list
const productLoad = async (req, res) => {
  try {
    const totalStock = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: {
            $sum: {
              $add: [
                "$variant.xs",
                "$variant.s",
                "$variant.m",
                "$variant.l",
                "$variant.xl",
                "$variant.xxl",
              ],
            },
          },
        },
      },
    ]);
    const stock = totalStock.length > 0 ? totalStock[0].totalStock : 0;
    console.log("productList loaded");
    const products = await Product.find().populate("discount");
    const category = await Category.find();
    const offers = await Offer.find();
    res.render("admins/products", {
      products,
      category,
      totalStock: stock,
      offers,
    });
  } catch (error) {
    console.log("productList not loaded", error.message);
  }
};

// add product
const addProduct = async (req, res) => {
  try {
    const category = await Category.find();
    res.render("admins/addProduct", { category });
    console.log("add product page rendered");
  } catch (error) {
    console.log("addProduct page not rendering", error.message);
  }
};

const productAdded = async (req, res) => {
  try {
    console.log("this is the outcome:", req.body);
    const { name, category, price, description, xs, s, m, l, xl, xxl } =
      req.body;
    console.log(req.files);
    const image = [];
    for (let i = 0; i < 4; i++) {
      image.push(req.files[i].filename);
    }
    console.log(image);
    const newProduct = new Product({
      name,
      category,
      price,
      description,
      image,
      variant: {
        xs: parseInt(xs),
        s: parseInt(s),
        m: parseInt(m),
        l: parseInt(l),
        xl: parseInt(xl),
        xxl: parseInt(xxl),
      },
    });
    console.log(newProduct);
    await newProduct.save(); //product saving
    console.log("successfully product saved");
    res.redirect("/admin/products");
  } catch (error) {
    console.log("ProductAdd error", error.message);
  }
};

//product listing and unlisting
const productList = async (req, res) => {
  try {
    console.log("list product");
    const { productId } = req.body;
    console.log(productId);
    if (productId) {
      const productInfo = await Product.findById(productId);
      console.log(productInfo);
      if (!productInfo) {
        console.log("Product not found in productList");
        return res.json({ success: false, message: "product not found" });
      }
      if (productInfo.is_listed === false) {
        productInfo.is_listed = true;
        await productInfo.save();
        return res.json({
          success: true,
          message: "Product listed successfully",
        });
      }
    }
  } catch (error) {
    console.log("productList got error", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const productUnlist = async (req, res) => {
  try {
    console.log("Unist product fnc");
    const { productId } = req.body;
    console.log(productId);
    if (productId) {
      const productInfo = await Product.findById(productId);
      console.log(productInfo);
      if (!productInfo) {
        console.log("Product not found in productList");
        return res.json({ success: false, message: "product not found" });
      }
      if (productInfo.is_listed === true) {
        productInfo.is_listed = false;
        await productInfo.save();
        console.log("saved");
        return res.json({
          success: true,
          message: "Product unlisted successfully",
        });
      }
    }
  } catch (error) {
    console.log("productList got error", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const editProduct = async (req, res) => {
  try {
    console.log("product id for edit", req.params.id);
    const id = req.params.id;
    console.log(id);
    const product = await Product.findById(id);
    const category = await Category.find();
    console.log("product details for edit rendering", product);
    res.render("admins/editProduct", { product, category });
    console.log("product edit page rendered");
  } catch (error) {
    console.log("product editPage is not rendered", error);
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log("enterd updt prd");
    console.log(req.body);
    console.log(req.files.filename);
    const image = [];
    if (req.files) {
      for (let i = 0; i < req.files.length; i++) {
        image.push(req.files[i].filename);
      }
    }
    console.log("img", image);
    const {
      productId,
      name,
      category,
      price,
      description,
      xs,
      s,
      m,
      l,
      xl,
      xxl,
      removedImages,
    } = req.body;

    const product = await Product.findById(productId);

    if (removedImages && removedImages.length > 0) {
      for (let i = 0; i < 4; i++) {
        await Product.updateOne(
          { _id: productId },
          { $pull: { image: removedImages[i] } }
        );
      }
      if (image) {
        for (let i = 0; i < image.length; i++) {
          await Product.updateOne(
            { _id: productId },
            { $push: { image: image[i] } }
          );
        }
      }
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.name = name;
    product.category = category;
    product.price = price;
    product.description = description;
    product.variant = { xs, s, m, l, xl, xxl };

    await product.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Category
const categoryLoad = async (req, res) => {
  try {
    console.log("categoryList loaded");
    const categories = await Category.find().populate("discount");
    const offers = await Offer.find();
    res.render("admins/category", { categories, offers });
  } catch (error) {
    console.log("categoryList not loaded", error.message);
  }
};

const categoryList = async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (categoryId) {
      const categoryInfo = await Category.findById(categoryId);
      console.log(categoryInfo);
      if (!categoryInfo) {
        console.log("category not found in categoryList");
        return res.json({ success: false, message: "category not found" });
      }
      if (categoryInfo.is_listed === false) {
        categoryInfo.is_listed = true;
        await categoryInfo.save();
        return res.json({
          success: true,
          message: "Category Listed successfully",
        });
      }
    }
  } catch (error) {
    console.log("error on categoryList");
  }
};

const categoryUnlist = async (req, res) => {
  try {
    console.log("unlist entered");
    const { categoryId } = req.body;
    console.log(categoryId);
    if (categoryId) {
      const categoryInfo = await Category.findById(categoryId);
      console.log(categoryInfo);
      if (!categoryInfo) {
        console.log("category not found in categoryUnlist");
        return res.json({ success: false, message: "category not found" });
      }
      if (categoryInfo.is_listed === true) {
        categoryInfo.is_listed = false;
        await categoryInfo.save();
        return res.json({
          success: true,
          message: "Category Unlisted successfully",
        });
      }
    }
  } catch (error) {
    console.log("error on categoryUnlist");
  }
};

const addCategory = async (req, res) => {
  try {
    res.render("admins/addCategory");
    console.log("addCategory loaded");
  } catch (error) {
    console.log("addCategory is not working");
  }
};

const categoryAdded = async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log(name);

    const category = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
    });
    if (!category) {
      const newCategory = new Category({
        name,
        description,
      });
      console.log(newCategory);
      await newCategory.save(); //product saving
      console.log("successfully category saved");
    }
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("CategoryAdd error", error.message);
  }
};

const editCategoryPage = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    const categoryName = req.query.categoryName;
    const categoryDescription = req.query.categoryDescription;

    res.render("admins/editCategory", {
      categoryId,
      categoryName,
      categoryDescription,
    });
  } catch (error) {
    console.error("Error loading edit category page:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryId, newName, newDescription } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Update category details
    category.name = newName;
    category.description = newDescription;

    // Save the updated category
    await category.save();

    // Redirect or send a response as needed
    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const categoryOfferApply = async (req, res) => {
  try {
    console.log("eneterd to category apply offer");
    const offerId = req.body.selectedOption;
    const categoryId = req.body.categoryId;

    const offer = await Offer.findOne({ _id: offerId });
    console.log(offer);
    const price = offer.discountOffer;

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    const category = await Category.findById(categoryId);
    console.log(category);
    const categoryName = category.name;
    await Product.updateMany(
      {
        category: categoryName,
        $or: [{ discount: null }, { discount: { $exists: false } }],
      },
      {
        $set: {
          discount: offer ? offer._id : null,
          discountPrice: price,
        },
      }
    );

    // updating final price
    const updateObject = {
      $set: {
        finalPrice: { $subtract: ["$actualPrice", price] },
      },
    };

    Product.updateMany(
      {
        category: categoryName,
        $or: [{ discount: null }, { discount: { $exists: false } }],
      },
      updateObject,
     
    );

    await Category.updateOne(
      { name: categoryName },
      {
        discount: offer ? offer._id : null,
      }
    );

    console.log("offer applied to category");

    res.json({ success: true, message: "Offer applied successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while applying the offer",
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("items.productId")
      .populate("userId");
    console.log("Orders loaded");
    res.render("admins/orders", { orders });
  } catch (error) {}
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    console.log("the deatail of order is", orderId);
    const order = await Order.findOne({ _id: orderId }).populate(
      "items.productId"
    );
    console.log("The order", order);
    res.render("admins/orderDetails", { order });
  } catch (error) {
    console.log("error in orderDetails", error);
  }
};

const orderStatus = async (req, res) => {
  try {
    console.log("changed order", req.body.orderId);
    console.log("changed status", req.body.itemUpdateStatus);
    const { itemUpdateStatus, orderId } = req.body;
    const order = await Order.findById(orderId);
    console.log("order in status", order);

    order.items.forEach((item) => {
      const updatedStatus = itemUpdateStatus[item._id];
      if (updatedStatus) {
        item.orderStatus = updatedStatus;
      }
    });
    await order.save();
    console.log("order status changed");
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.log("error on orderStatus", error);
  }
};

// product coupon
const productCoupon = async (req, res) => {
  try {
    console.log("Entered to coupon page");
    const coupons = await Coupon.find({});
    res.render("admins/coupon", { coupons });
  } catch (error) {
    console.log("error on coupon loading", error.message);
  }
};

const addCoupon = async (req, res) => {
  try {
    res.render("admins/addCoupon");
  } catch (error) {
    console.log("add coupon not loaded");
  }
};

const couponAdding = async (req, res) => {
  try {
    console.log("coupon datas: ", req.body);
    const { couponCode, discountAmount, minimumSpend, startDate, endDate } =
      req.body;
    if (couponCode && discountAmount && minimumSpend && startDate && endDate) {
      const coupon = new Coupon({
        couponCode,
        discountAmount,
        minimumSpend,
        startDate,
        endDate,
      });

      await coupon.save();
      console.log("New coupon added successfully");
    }
    res.redirect("/admin/product-coupon");
  } catch (error) {
    console.log("error on adding coupon", error);
  }
};

const couponDelete = async (req, res) => {
  try {
    const code = req.body.code;
    console.log("Deletion coupon code:", code);

    const deletedCoupon = await Coupon.findOneAndDelete({ couponCode: code });

    if (deletedCoupon) {
      res.status(200).json({ message: "Coupon deleted successfully" });
    } else {
      console.log("Coupon not found");
      res.status(404).json({ error: "Coupon not found" });
    }
  } catch (error) {
    console.log("Coupon deletion error:", error.message);

    res.status(500).json({ error: "Failed to delete coupon" });
  }
};

const editCoupon = async (req, res) => {
  try {
    console.log("code of coupon for edit", req.query.code);
    const code = req.query.code;
    console.log(code);
    const coupon = await Coupon.findOne({ couponCode: code });
    if (coupon) {
      res.render("admins/editCoupon", { coupon });
    }
    console.log("coupon not found");
  } catch (error) {
    console.log("error on coupon edit load");
  }
};

const couponEdit = async (req, res) => {
  try {
    console.log("req.body in edit coupon", req.body);
    const { id, couponCode, discountAmount, minimumSpend, startDate, endDate } =
      req.body;
    console.log("coupon id for edit", id);
    if (id) {
      const coupon = await Coupon.findById(id);
      console.log(coupon);
      coupon.couponCode = couponCode;
      coupon.discountAmount = discountAmount;
      coupon.minimumSpend = minimumSpend;
      coupon.startDate = startDate;
      coupon.endDate = endDate;

      await coupon.save();
      console.log("Coupon changed properly");
      res.redirect("/admin/product-coupon");
    }
  } catch (error) {
    console.log("error on coupon editing form ");
  }
};

const productOffer = async (req, res) => {
  try {
    const offers = await Offer.find({});
    res.render("admins/offer", { offers: offers });
    console.log("offer page rendered");
  } catch (error) {
    console.log("productOffer not rendered");
  }
};

const addOffer = async (req, res) => {
  try {
    res.render("admins/addOffer");
    console.log("add offer rendered");
  } catch (error) {
    console.log("add offer error");
  }
};

const newOffer = async (req, res) => {
  try {
    console.log("new offer creating data", req.body);
    const { offerName, validFrom, expiry, discountOffer } = req.body;
    const offer = new Offer({
      offerName,
      validFrom,
      expiry,
      discountOffer,
    });

    await offer.save();
    console.log("new offer saved");
    res.redirect("/admin/product-offer");
  } catch (error) {
    console.log(error);
  }
};

const productOfferApply = async (req, res) => {
  try {
    console.log("req.body in offerapply", req.body);
    const offerId = req.body.selectedOption;
    const productId = req.body.productId;

    const offer = await Offer.findOne({ _id: offerId });
    console.log(offer);

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    const price = offer.discountOffer;
    console.log(typeof price);

    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          discount: offer._id,
          discountPrice: price,
        },
      }
    );

    const product = await Product.findOne({ _id: productId });
    const actualPrice = product.price;
    const finalPrice = actualPrice - price;

    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          finalPrice: finalPrice,
        },
      }
    );

    console.log("offer applied to product");

    res.json({ success: true, message: "Offer applied successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while applying the offer",
    });
  }
};

const productOfferRemove = async (req, res) => {
  try {
    const productId = req.body.productId;
    await Product.updateOne(
      { _id: productId },
      {
        $unset: {
          discount: "",
          discountPrice: "",
          finalPrice: "",
        },
      }
    );
    console.log("Offer removed");

    res.json({ success: true, message: "Offer removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while removing the offer",
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    await Product.updateMany(
      { discount: offerId },
      {
        $set: {
          discount: null,
          discountPrice: null,
          finalPrice: null,
        },
      }
    );
    console.log("product offer removing");

    const deletedOffer = await Offer.findOneAndDelete({ _id: offerId });

    if (deletedOffer) {
      res.status(200).json({ message: "Offer deleted successfully" });
    } else {
      console.log("Offer not found");
      res.status(404).json({ error: "Offer not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete offer" });
  }
};

const bannerPage = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.render("admins/banner", { banners });
    console.log("Banner page loaded");
  } catch (error) {
    console.log(error);
  }
};

const addBanner = async (req, res) => {
  try {
    res.render("admins/addBanner");
    console.log("add new banner page loaded");
  } catch (error) {
    console.log(error);
  }
};

const newBanner = async (req, res) => {
  try {
    const { name, link, description } = req.body;
    const image = req.file.filename;
    const banner = new Banner({
      name,
      link,
      image,
      description,
    });

    await banner.save();
    console.log("new banner saved");
    res.redirect("/admin/banners");
  } catch (error) {
    console.log(error);
  }
};

const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.body.bannerId;

    const deletedBanner = await Banner.findByIdAndDelete(bannerId);
    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.log(error);
  }
};

const unlistBanner = async (req, res) => {
  try {
    console.log("Unist banner fnc");
    const { bannerId } = req.body;
    if (bannerId) {
      const bannerInfo = await Banner.findById(bannerId);
      if (!bannerInfo) {
        console.log("Banner not found in bannerList");
        return res.json({ success: false, message: "banner not found" });
      }
      if (bannerInfo.is_listed === true) {
        bannerInfo.is_listed = false;
        await bannerInfo.save();
        console.log("saved");
        return res.json({
          success: true,
          message: "Banner unlisted successfully",
        });
      }
    }
  } catch (error) {
    console.log("unlistBanner got error", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const bannerList = async (req, res) => {
  try {
    console.log("list banner");
    const { bannerId } = req.body;
    if (bannerId) {
      const bannerInfo = await Banner.findById(bannerId);
      if (!bannerInfo) {
        console.log("Banner not found in bannerList");
        return res.json({ success: false, message: "banner not found" });
      }
      if (bannerInfo.is_listed === false) {
        bannerInfo.is_listed = true;
        await bannerInfo.save();
        return res.json({
          success: true,
          message: "Banner listed successfully",
        });
      }
    }
  } catch (error) {
    console.log("bannerList got error", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  loadAdmin,
  verifyAdmin,

  adminLogout,

  loadDashboard,
  sendDashboardData,
  salesReport,

  usersLoad,
  userBlock,
  userUnblock,

  productLoad,
  productList,
  productUnlist,
  addProduct,
  productAdded,
  editProduct,
  updateProduct,

  categoryLoad,
  categoryList,
  categoryUnlist,
  addCategory,
  categoryAdded,
  editCategoryPage,
  updateCategory,

  userOrders,
  orderDetails,
  orderStatus,

  productCoupon,
  addCoupon,
  couponAdding,
  couponDelete,
  editCoupon,
  couponEdit,

  productOffer,
  addOffer,
  newOffer,
  productOfferApply,
  productOfferRemove,
  deleteOffer,
  categoryOfferApply,

  bannerPage,
  addBanner,
  newBanner,
  deleteBanner,
  unlistBanner,
  bannerList,
};
