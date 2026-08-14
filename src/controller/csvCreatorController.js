import fs from "fs";
import csv from "csv-parser";
import CsvCreator from "../models/CsvCreator.js";
import CSVUploadReport from "../models/CSVUploadReport.js";
import pLimit from "p-limit";
import { io } from "../server.js";



// =============================
// CLEAN DATA FUNCTIONS
// =============================

const cleanText = (value) => {
    if (value === null || value === undefined) return "";

    const text = String(value).trim();

    if (
        text === "" ||
        text.toLowerCase() === "null" ||
        text.toLowerCase() === "undefined"
    ) {
        return "";
    }

    return text;
};



const cleanEmail = (value)=>{

    if(!value) return "";

    return String(value)
    .trim()
    .toLowerCase();

};



const cleanPhone = (value)=>{

    if(!value) return "";


    let phone = String(value)
    .trim()
    .replace(/\s+/g,"")
   .replace(/\.0$/,"");


    // Fix Excel scientific notation

    if(phone.includes("E") || phone.includes("e")){

        phone = Number(phone)
        .toFixed(0);

    }


    // remove country code

    phone = phone.replace("+91","");


    return phone;

};

const getInstagramFollowersRange = (followers) => {

  if (
    followers === null ||
    followers === undefined ||
    followers === "" ||
    Number(followers) <= 0
  ) {
    return "";
  }

  followers = Number(followers);

  if (followers < 1000) return "Under 1K";
  if (followers < 10000) return "1K - 10K";
  if (followers < 50000) return "10K - 50K";
  if (followers < 100000) return "50K - 100K";
  if (followers < 500000) return "100K - 500K";
  if (followers < 1000000) return "500K - 1M";
  if (followers < 5000000) return "1M - 5M";

  return "5M+";
};


const getInfluencerType = (followers) => {

  followers = Number(followers) || 0;

  if (followers >= 1000 && followers < 10000) {
    return "Nano Influencer";
  }

  if (followers >= 10000 && followers < 100000) {
    return "Micro Influencer";
  }

  if (followers >= 100000 && followers < 1000000) {
    return "Macro Influencer";
  }

  if (followers >= 1000000) {
    return "Mega Influencer";
  }

  return "Nano Influencer";
};
// ==========================
// UPLOAD CSV
// ==========================
export const uploadCreatorsCSV = async (req, res) => {
  try {
    console.log("===== CSV UPLOAD START =====");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file required",
      });
    }

    console.log("Uploaded File:", req.file);

    const creators = [];

    fs.createReadStream(req.file.path)
      .pipe(csv({
  mapHeaders: ({header}) =>
    header.replace(/^\uFEFF/, "").trim()
}))
      .on("data", (row) => {
       const exactFollowers =
  Number(
    String(row["Exact Followers"] || "0").replace(/,/g, "")
  );

let instagramFollowers =
  Number(
    String(row["Instagram Followers Range"] || "0").replace(/,/g, "")
  ) || 0;

if (!instagramFollowers && exactFollowers > 0) {
  instagramFollowers = exactFollowers;
}

const instagramFollowersRange =
  getInstagramFollowersRange(instagramFollowers);

        creators.push({
          timestamp: row["Timestamp"] || "",

          instagramUsername: row["Instagram Username"] || "",

          instagramProfileLink: row["Instagram Profile Link"] || "",

          instagramFollowersRange,
            

          exactFollowers,

          categories: row["Categories"]
            ? row["Categories"]
                .split(",")
                .map((item) => item.trim())
            : [],

          phoneNumber: cleanPhone(row["Phone Number"]) || "",

          whatsappNumber: cleanPhone(row["Whatsapp Number"])|| "",

          fullName: cleanText(row["Full Name"] )|| "",

          email:cleanEmail (row["Email"]) || "",

          gender: row["Gender"] || "",

          dateOfBirth: row["Date of Birth"] || "",
            influencerType: getInfluencerType(exactFollowers),
          campaignType: row["Campaign type"]
            ? row["Campaign type"]
                .split(",")
                .map((item) => item.trim())
            : [],

          whatKindOfDealDoYouParticipateIn:
            row["What kind of deal do you participate in"] || "",

          languages: row["Languages"]
            ? row["Languages"]
                .split(",")
                .map((item) => item.trim())
            : [],

          speakingVideoLink:
            row["Speaking Video Link"] || "",

          fullAddress:
            row["Full Address"] || "",

          landmark:
            row["Landmark"] || "",

          city:
            row["City"] || "",

          state:
            row["State"] || "",

          country:
            row["Country"] || "",

          pincode:
            row["Pincode"] || "",

          photoLink:
            row["Photo Link"] || "",

          youtubeUsername:
            row["YouTube Username"] || "",

          youtubeChannelLink:
            row["YouTube Channel Link"] || "",

          youtubeSubscribersRange:
            row["YouTube Subscribers Range"] || "",

          commercialsFor1InstagramReel:
            Number(row["Commercials For 1 Instagram Reel"]) || 0,

          commercialsFor1InstagramStory:
            Number(row["Commercials For 1 Instagram Story"]) || 0,

          commercialsFor1InstagramPost:
            Number(row["Commercials For 1 Instagram Post"]) || 0,

          commercialsFor1DedicatedYouTubeVideo:
            Number(
              row["Commercials For 1 Dedicated YouTube Video"]
            ) || 0,

          commercialsFor1IntegratedYouTubeVideo:
            Number(
              row["Commercials For 1 Integrated YouTube Video"]
            ) || 0,

          commercialsFor1DedicatedYouTubeShortsVideo:
            Number(
              row[
                "Commercials For 1 Dedicated YouTube Shorts Video"
              ]
            ) || 0,

          commercialsFor1IntegratedYouTubeShortsVideo:
            Number(
              row[
                "Commercials For 1 Integrated YouTube Shorts Video"
              ]
            ) || 0,


          bio:
            row["Bio"] || "",

          areYouATvMoviesOttCelebrity:
            row["Are you a TV/movies/OTT celebrity"] || "",

          typeOfCeleb:
            row["Type of Celeb"] || "",

          whatAllPlatformsAreYouAvailableOn:
            row["What all platforms are you avilable on"]
              ? row["What all platforms are you avilable on"]
                  .split(",")
                  .map((item) => item.trim())
              : [],

          howManyAmazonReviewsYouDoPerMonth:
            Number(
              row["How many Amazon reviews you do per month"]
            ) || 0,

          fetchedFromBrandPage:
            row["Fetched from Brand Page"] || "",

          fetchedForBrand:
            row["Fetched For Brand"] || "",

          platform:
            row["Platform"] || "",

          fetchedDate:
            row["Fetched Date"] || "",

          InflunexaUserId: Number(row["InflunexaUserId"]) || null,

        });
      })

      .on("end", async () => {
        try {
          console.log("Total Creators:", creators.length);

          if (creators.length === 0) {
            return res.status(400).json({
              success: false,
              message: "CSV has no data",
            });
          }
          const isFirstUpload =
  (await CsvCreator.countDocuments()) === 0;
           const report = [];

         let totalRecords = creators.length;
         let successfulRecords = 0;
         let updatedRecords = 0;
          let failedRecords = 0;

  const limit = pLimit(25);
  await Promise.all(
  creators.map((creator, index) => 
        limit(async () => {

//     if (!creator.fullName?.trim()) {

//     failedRecords++;

//     report.push({
//         row: i + 2,
//         fullName: "",
//         email: creator.email,
//         phoneNumber: creator.phoneNumber,
//         instagramUsername: creator.instagramUsername,
//         youtubeName: creator.youtubeName,
//         status: "Failed",
//         reason: "Full Name is required"
//     });

//     continue;
// }

if (!creator.email?.trim() && !creator.phoneNumber?.trim()) {

    failedRecords++;

    report.push({
        row: index  + 1,
        fullName: creator.fullName,
        email: "",
        phoneNumber: "",
        instagramUsername: creator.instagramUsername,
        youtubeUsername: creator.youtubeUsername,
        status: "Failed",
        reason: "Either Email or Mobile Number is required"
    });

    return;
}
 const hasInstagram =
    cleanText(creator.instagramUsername) !== "" 


const hasYoutube =
    cleanText(creator.youtubeUsername) !== "" 

if (!hasInstagram && !hasYoutube) {

    failedRecords++;

    report.push({
        row: index + 1,
        fullName: creator.fullName,
        email: creator.email,
        phoneNumber: creator.phoneNumber,
        instagramUsername: creator.instagramUsername,
        youtubeUsername: creator.youtubeUsername,
        status: "Failed",
        reason: "Either Instagram or YouTube details are required"
    });

    return;
}
try {

let existingCreator = null;


const email = cleanEmail(
    creator.email
);


const phone = cleanPhone(
    creator.phoneNumber
);



const instagramUsername = cleanText(
  creator.instagramUsername
).toLowerCase();

const youtubeUsername = cleanText(
    creator.youtubeUsername
).toLowerCase();

// VALIDATION

if (!isFirstUpload) {

    const conditions = [];

if (email) {
    conditions.push({
        email: {
            $regex: `^${email}$`,
            $options: "i"
        }
    });
}

if (phone) {
    conditions.push({
        phoneNumber: phone
    });
}

if (instagramUsername) {
    conditions.push({
        instagramUsername: {
            $regex: `^${instagramUsername}$`,
            $options: "i"
        }
    });
}

if (youtubeUsername) {
    conditions.push({
        youtubeUsername: {
            $regex: `^${youtubeUsername}$`,
            $options: "i"
        }
    });
}

if (conditions.length) {
    existingCreator = await CsvCreator.findOne({
        $or: conditions
    });
}
}
// ===============================
// EXISTING USER
// ===============================

if(existingCreator){

let isUpdated = false;

let changedFields=[];



const compareFields=[


"fullName",

"email",

"phoneNumber",

"whatsappNumber",

"instagramUsername",

"instagramProfileLink",

"instagramFollowersRange",

"exactFollowers",

"categories",
"youtubeUsername",

"youtubeChannelLink",

"youtubeSubscribersRange",

"city",

"state",

"country",

"bio"

];



compareFields.forEach((key)=>{


let oldValue = existingCreator[key];

let newValue = creator[key];



if(Array.isArray(oldValue)){

oldValue = JSON.stringify(
oldValue.sort()
);

}



if(Array.isArray(newValue)){

newValue = JSON.stringify(
newValue.sort()
);

}



if(key==="phoneNumber" || key==="whatsappNumber"){

oldValue = cleanPhone(oldValue);
newValue = cleanPhone(newValue);

}
else{

oldValue = String(oldValue || "")
.trim()
.toLowerCase();


newValue = String(newValue || "")
.trim()
.toLowerCase();

}

if (oldValue !== newValue) {

    existingCreator[key] = creator[key];

    isUpdated = true;

    changedFields.push(key);

}


});


// Only save if something changed

if(isUpdated){

await existingCreator.save();

updatedRecords++;


report.push({

row:index+1,

fullName:creator.fullName,

email:creator.email,

phoneNumber:creator.phoneNumber,
instagramUsername: creator.instagramUsername,
youtubeUsername: creator.youtubeUsername,

status:"Updated",

reason:
`Updated fields: ${changedFields.join(", ")}`

});


}

else{


// Same data no update

report.push({

row:index+1,

fullName:creator.fullName,

email:creator.email,

phoneNumber:creator.phoneNumber,
instagramUsername: creator.instagramUsername,
youtubeUsername: creator.youtubeUsername,
status:"Skipped",

reason:"No changes found"

});


}

}



// ===============================
// NEW USER
// ===============================

else{


await CsvCreator.create(creator);


successfulRecords++;


report.push({

row:index+1,

fullName:creator.fullName,

email:
cleanEmail(
creator.email
),

phoneNumber:
cleanPhone(
creator.phoneNumber
),

instagramUsername: creator.instagramUsername,
youtubeUsername: creator.youtubeUsername,
status:"Uploaded",

reason:"New creator added"

});


}



}
catch(error){


failedRecords++;


report.push({

row:index+1,

status:"Failed",

reason:error.message

});
}
})
)
)

      const reportSize = Buffer.byteLength(
    JSON.stringify(report),
    "utf8"
);

console.log(
    "REPORT SIZE:",
    (reportSize / 1024 / 1024).toFixed(2),
    "MB"
);

console.log(
    "REPORT ROWS:",
    report.length
);  

// SAVE REPORT PERMANENTLY
const savedReport = await CSVUploadReport.create({
    fileName: req.file.originalname,
    totalRecords,
    successfulRecords,
    updatedRecords,
    failedRecords,
    report,
});


fs.unlink(req.file.path, () => {});

if(io){

io.emit(
"new-csv-creator"
);

}
return res.status(200).json({

    success: true,

    message: "CSV uploaded successfully",

    reportId: savedReport._id,

    totalRecords,

    successfulRecords,
    updatedRecords,

    failedRecords,

    report,
});
        } catch (err) {
          console.error("INSERT ERROR:");
          console.error(err);

          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }
      })

      .on("error", (err) => {
        console.error("CSV READ ERROR:", err);

        return res.status(500).json({
          success: false,
          message: err.message,
        });
      });

  } catch (err) {
    console.error("MAIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//  EDIT CSV CREATOR
export const updateCsvCreator = async (req, res) => {

  try {

    const updatedCreator = await CsvCreator.findByIdAndUpdate(
      req.params.id,
    {
      ...req.body,
      editStatus: "Edited Manually",
        updatedAt: new Date(),
    },
      {
        new:true
      }
    );


    res.status(200).json({
      success:true,
      creator: updatedCreator
    });


  } catch(error){

    console.log("UPDATE CSV ERROR:", error);

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

// get latest report

 export const getLatestCSVReport = async(req,res)=>{

try{

const report = await CSVUploadReport
.findOne()
.sort({
createdAt:-1
});

if(!report){
 return res.json({

success:true,

report:null,
message:"No CSV report found"

});
}
return res.json({

success:true,

report

});

}catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};
// ==========================
// DELETE ALL CREATORS
// ==========================
export const deleteCSVCreators = async (req,res)=>{

try{

const result = await CsvCreator.deleteMany({});


const deletedReports = await CSVUploadReport.deleteMany({});
if(io){

io.emit(
"delete-all-csv-creators"
);

}
return res.json({

success:true,

message:`${result.deletedCount} creators deleted`

});


}
catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

};

// DELETE SINGLE CSV CREATOR

export const deleteCsvCreator = async(req,res)=>{

try{


const {id} = req.params;


const creator = await CsvCreator.findByIdAndDelete(id);



if(!creator){

return res.status(404).json({

success:false,

message:"Creator not found"

});

}

if(io){

io.emit(
"delete-csv-creator",
id
);

}

return res.json({

success:true,

message:"CSV creator deleted successfully"

});


}
catch(error){


return res.status(500).json({

success:false,

message:error.message

});


}


};

export const getCsvCreators = async(req,res)=>{

try{


const {

  timestamp,

  instagramUsername,
  instagramProfileLink,
  instagramFollowersRange,
  exactFollowers,

  categories,

  phoneNumber,
  whatsappNumber,

  fullName,
  email,

  gender,
  dateOfBirth,
 influencerType,
  campaignType,
  whatKindOfDealDoYouParticipateIn,
whatAllPlatformsAreYouAvailableOn,
  languages,

  speakingVideoLink,

  fullAddress,
  landmark,
  city,
  state,
  country,
  pincode,

  photoLink,

  youtubeUsername,
  youtubeChannelLink,
  youtubeSubscribersRange,

commercialsFor1InstagramReel,
commercialsFor1InstagramStory,
commercialsFor1InstagramPost,
commercialsFor1DedicatedYouTubeVideo,
commercialsFor1IntegratedYouTubeVideo,
commercialsFor1DedicatedYouTubeShortsVideo,
commercialsFor1IntegratedYouTubeShortsVideo,

howManyAmazonReviewsYouDoPerMonth,
bio,

  areYouATvMoviesOttCelebrity,
  typeOfCeleb,

  platform,

  fetchedFromBrandPage,
  fetchedForBrand,
  fetchedDate,

  InflunexaUserId,
 contactStatus,

page=1,
limit=100


}=req.query;



// ==============================
// FILTERS
// ==============================

const filter = {};

// ==============================
// PERSONAL DETAILS
// ==============================

if (fullName?.trim()) {
  filter.fullName = {
    $regex: fullName.trim(),
    $options: "i",
  };
}

if (email?.trim()) {
  filter.email = {
    $regex: email.trim(),
    $options: "i",
  };
}

if (phoneNumber?.trim()) {
  filter.phoneNumber = {
    $regex: phoneNumber.trim(),
    $options: "i",
  };
}

if (gender) {
  filter.gender = {
    $in: gender.split(",").map(item => item.trim()),
  };
}

if (dateOfBirth?.trim()) {
  const [year, month, day] = dateOfBirth.split("-");

  filter.dateOfBirth = `${day}-${month}-${year}`;
}
// ==============================
// INSTAGRAM
// ==============================

if (instagramUsername?.trim()) {
  filter.instagramUsername = {
    $regex: instagramUsername.trim(),
    $options: "i",
  };
}

if (instagramFollowersRange) {
  filter.instagramFollowersRange = {
    $in: instagramFollowersRange
      .split(",")
      .map(item => item.trim())
  };
}
// Exact Followers Filter
if (req.query.exactFollowers?.trim()) {
  filter.$expr = {
    $regexMatch: {
      input: { $toString: "$exactFollowers" },
      regex: "^" + req.query.exactFollowers,
      options: "i"
    }
  };
}

// ==============================
// CATEGORY
// ==============================

if (categories) {
  filter.categories = {
    $in: categories.split(",").map(item => item.trim()),
  };
}

// ==============================
// LOCATION
// ==============================

if (city?.trim()) {
  filter.city = {
    $regex: city.trim(),
    $options: "i",
  };
}

if (state) {
  filter.state = {
    $in: state.split(",").map(item => item.trim()),
  };
}

if (country) {

  const countries = country.split(",").map(item => item.trim());

  filter.country = {
    $in: countries
  };

}
if (pincode?.trim()) {
  filter.pincode = {
    $regex: pincode.trim(),
    $options: "i",
  };
}

// ==============================
// YOUTUBE
// ==============================

if (youtubeUsername?.trim()) {
  filter.youtubeUsername = {
    $regex: youtubeUsername.trim(),
    $options: "i",
  };
}
if (youtubeSubscribersRange) {
  filter.youtubeSubscribersRange = {
    $in: youtubeSubscribersRange
      .split(",")
      .map(item => item.trim()),
  };
}

// ==============================
// CELEBRITY
// ==============================

if (typeOfCeleb) {
  filter.typeOfCeleb = {
    $in: typeOfCeleb.split(",").map(item => item.trim()),
  };
}

// ==============================
// PLATFORM
// ==============================
if (platform) {
  filter.platform = {
    $in: platform.split(",").map(item => item.trim()),
  };
}

// ==============================
// LANGUAGES
// ==============================
if (languages) {
  filter.languages = {
    $in: languages.split(",").map(item => item.trim()),
  };
}

if (req.query.InflunexaUserId) {
  filter.$expr = {
    $regexMatch: {
      input: { $toString: "$InflunexaUserId" },
      regex: "^" + req.query.InflunexaUserId,
    },
  };
}
// ==============================
// CAMPAIGN TYPE
// ==============================

if (campaignType) {
  filter.campaignType = {
    $in: campaignType.split(",").map(item => item.trim()),
  };
}

if (influencerType) {

  const types = influencerType
    .split(",")
    .map(item => item.trim());

  const conditions = [];

  types.forEach(type => {

    switch (type) {

      case "Nano Influencer":
        conditions.push({
          exactFollowers: {
            $gte: 1000,
            $lt: 10000,
          }
        });
        break;

      case "Micro Influencer":
        conditions.push({
          exactFollowers: {
            $gte: 10000,
            $lt: 100000,
          }
        });
        break;

      case "Macro Influencer":
        conditions.push({
          exactFollowers: {
            $gte: 100000,
            $lt: 1000000,
          }
        });
        break;

      case "Mega Influencer":
        conditions.push({
          exactFollowers: {
            $gte: 1000000,
          }
        });
        break;

    }

  });

  if (conditions.length > 0) {
    filter.$or = conditions;
  }

}


// ==============================
// CONTACT STATUS
// ==============================

// ==============================
// CONTACT STATUS
// ==============================

if (contactStatus) {

  switch (contactStatus) {

    // Has mobile but no email
    case   "Mobile Only":
      filter.$and = [
        {
          phoneNumber: {
            $exists: true,
            $nin: ["", null]
          }
        },
        {
          $or: [
            { email: "" },
            { email: null },
            { email: { $exists: false } }
          ]
        }
      ];
      break;

    // Has email but no mobile
    case "Email Only":
      filter.$and = [
        {
          email: {
            $exists: true,
            $nin: ["", null]
          }
        },
        {
          $or: [
            { phoneNumber: "" },
            { phoneNumber: null },
            { phoneNumber: { $exists: false } }
          ]
        }
      ];
      break;

    // Has both
    case "Both Email & Mobile":
      filter.$and = [
        {
          email: {
            $exists: true,
            $nin: ["", null]
          }
        },
        {
          phoneNumber: {
            $exists: true,
            $nin: ["", null]
          }
        }
      ];
      break;
  }

}

// DATABASE QUERY
// =====================

// Count total matching records
const total = await CsvCreator.countDocuments(filter);

// ===============================
// DOWNLOAD ALL FILTERED DATA
// ===============================
if (req.query.download === "true") {

  const creators = await CsvCreator.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    total,
    data: creators,
  });

}

// ===============================
// PAGINATION
// ===============================
const pageNumber = parseInt(page, 10) || 1;
const limitNumber = parseInt(limit, 10) || 100;

const skip = (pageNumber - 1) * limitNumber;

const creators = await CsvCreator.find(filter)
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNumber);

return res.status(200).json({
  success: true,
  total,
  page: pageNumber,
  limit: limitNumber,
  totalPages: Math.ceil(total / limitNumber),
  data: creators,
});


}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


};


// GET DYNAMIC FILTER OPTIONS
export const getCsvFilterOptions = async (req, res) => {
  try {
    const creators = await CsvCreator.find({}, {
      gender: 1,
      state: 1,
      country: 1,
      categories: 1,
      languages: 1,
      campaignType: 1,
      typeOfCeleb: 1,
      platform: 1,
      youtubeSubscribersRange: 1,
      _id: 0,
    });

    const unique = (arr) =>
      [...new Set(arr.filter(v => v && String(v).trim() !== ""))].sort();

    const options = {
      gender: unique(creators.map(c => c.gender)),
      state: unique(creators.map(c => c.state)),
      country: unique(creators.map(c => c.country)),
      typeOfCeleb: unique(creators.map(c => c.typeOfCeleb)),
      platform: unique(creators.map(c => c.platform)),
      youtubeSubscribersRange: unique(
        creators.map(c => c.youtubeSubscribersRange)
      ),

      categories: unique(
        creators.flatMap(c => c.categories || [])
      ),

      languages: unique(
        creators.flatMap(c => c.languages || [])
      ),

      campaignType: unique(
        creators.flatMap(c => c.campaignType || [])
      ),
    };

    res.json({
      success: true,
      options,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};