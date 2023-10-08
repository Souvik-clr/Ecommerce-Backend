const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "content");  //null -> error,content -> destination folder
    },
    //if two people give image of sme name there will be conflict.To stop this change the file name.so added date time with name.
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 * 100 },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpg|png|mp4|mkv|flv|mov|wmv|gif/;
        console.log('file', file.mimetype, file.originalname);
        const mimeType = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(path.extname(file.originalname));

        if (mimeType && extname) {
            console.log(fileTypes);
            return cb(null, true);
        }
        cb("Give proper files formate to upload");
        // return cb(null, true);
    },
}).single("content");//at a time upload a single image



module.exports = upload;