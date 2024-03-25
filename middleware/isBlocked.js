const User = require("../models/userModel");

const isBlock = async (req, res, next) => {
    try {
        if (req.session.user) {
            const { id } = req.session.user;
            const user = await User.findById(id);

            if (user && !user.is_blocked) { // Add a check to ensure user is not null
                next();
            } else {
                req.session.destroy();
                return res.redirect('/login');
            }
        } else {
            return res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = isBlock;
