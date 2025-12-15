const multer = require('multer');

const photoUpload = multer({
    fileFilter: (req, file, callback) => {
        if (file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpeg') {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
    limits: {
        fileSize: 1024 * 50
    }
});

module.exports = photoUpload;