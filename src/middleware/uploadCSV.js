import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads folder automatically
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}


const storage = multer.diskStorage({

  destination:(req,file,cb)=>{

    cb(null, uploadDir);

  },


  filename:(req,file,cb)=>{

    const uniqueName =
      Date.now() +
      "-" +
      file.originalname.replace(/\s+/g,"_");


    cb(null,uniqueName);

  }

});



const uploadCSV = multer({

  storage,


  fileFilter:(req,file,cb)=>{


    const ext =
      path.extname(file.originalname)
      .toLowerCase();


    if(ext === ".csv"){

      cb(null,true);

    }
    else{

      cb(
        new Error(
          "Only CSV files are allowed"
        )
      );

    }

  },


  limits:{


    // 50 MB CSV limit
    fileSize:
      1024*1024*1024

  }


});


export default uploadCSV;