const multer = require('multer');


const productImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/productImages');
    },
    filename: function (req, file, cb) {
        let ext = file.originalname.slice(file.originalname.lastIndexOf("."))
        cb(null, Date.now() + '-' + req.body.name + ext);
    }
});

const bannerImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/bannerImages');
    },
    filename: function (req, file, cb) {
        let ext = file.originalname.slice(file.originalname.lastIndexOf("."))
        cb(null, Date.now() + '-' + req.body.name + ext);
    }
});

const uploadProductImages = multer({ storage: productImageStorage }).array('productImages', 4);

const uploadBannerImage = multer({ storage: bannerImageStorage }).single('image');

module.exports = {
    uploadProductImages,
    uploadBannerImage
};