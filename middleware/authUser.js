const islogin = (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

const isLogout = (req, res, next) => {
  try {
    console.log(req.session.user);
    if (req.session.user) {
      console.log("checkingashdkash");
      return res.redirect("/");
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  islogin,
  isLogout,
};
