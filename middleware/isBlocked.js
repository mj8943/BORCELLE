const User = require("../models/userModel");

const isBlocked = async(req,res,next) =>{
    try {
        if(req.session.user){
            const{ id } = req.session.user;
            const user = await User.findById(id);
            if(!user.is_blocked){
                next();
                return;
            }
        }
        req.session.destroy();
        res.redirect('/login')
        return;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isBlocked
};