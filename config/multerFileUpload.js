import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the directory where temporary files will be stored
    console.log("REQ :: ", req)
    cb(null, 'tempaudioupload/'); 
  },
  filename: (req, file, cb) => {
    // Create a unique file name using current timestamp and original extension
    console.log("REQ2 ::",req)
    cb(null, `${file.fieldname}-${Date.now()}.${file.originalname.split('.').pop()}`);
  }
});

export const upload = multer({ storage: storage });
