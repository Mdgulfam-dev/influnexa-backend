import fs from "fs";
import csv from "csv-parser";
import CsvBrand from "../models/CsvBrand.js";
import CSVBrandUploadReport  from "../models/CSVBrandUploadReport.js";
import pLimit from "p-limit";
import { io } from "../server.js";

// ========================================
// CLEAN FUNCTIONS
// ========================================

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

const cleanEmail = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase();
};

const cleanPhone = (value) => {
  if (!value) return "";

  let phone = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/\.0$/, "");

  // Excel scientific notation
  if (phone.includes("E") || phone.includes("e")) {
    phone = Number(phone).toFixed(0);
  }

  // Remove +91
  phone = phone.replace(/^\+91/, "");

  return phone;
};

// ========================================
// UPLOAD BRAND CSV
// ========================================

export const uploadBrandsCSV = async (req, res) => {
  try {
    console.log("===== BRAND CSV UPLOAD START =====");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file required",
      });
    }

    console.log("Uploaded File:", req.file);

    const brands = [];

    fs.createReadStream(req.file.path)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header.replace(/^\uFEFF/, "").trim(),
        }),
      )

      .on("data", (row) => {
        brands.push({
          companyName: cleanText(
            row["Company Name"]
          ),

          fullName: cleanText(
            row["Full Name"]
          ),

          prospects: cleanText(
            row["ProsPects"]
          ),

          email: cleanEmail(
            row["Email Id"]
          ),

          officialEmail: cleanEmail(
            row["Official Email Id"]
          ),

          mobileNumber: cleanPhone(
            row["Mobile Number"]
          ),

          linkedinProfile: cleanText(
            row["Linkedin Profile"]
          ),

          city: cleanText(
            row["City"]
          ),

          address: cleanText(
            row["Address"]
          ),

          directors: cleanText(
            row["Directors"]
          ),

          ageOfCompany: cleanText(
            row["Age of the Company"]
          ),

          websiteUrl: cleanText(
            row["Website URL"]
          ),

          dataType: cleanText(
            row["Data Type"]
          ),

          status:
            cleanText(row["Status"]) || "Pending",

          actionButton: cleanText(
            row["Action Button"]
          ),
        });
      })

      .on("end", async () => {
        try {
          console.log(
            "Total Brands:",
            brands.length
          );

          if (brands.length === 0) {
            fs.unlink(req.file.path, () => {});

            return res.status(400).json({
              success: false,
              message: "CSV has no data",
            });
          }

          const isFirstUpload =
            (await CsvBrand.countDocuments()) === 0;

          const report = [];

          let totalRecords = brands.length;
          let successfulRecords = 0;
          let updatedRecords = 0;
          let failedRecords = 0;

          const limit = pLimit(25);

          await Promise.all(
            brands.map((brand, index) =>
              limit(async () => {
                try {
                  // ========================================
                  // VALIDATION
                  // ========================================

                  if (
                    !brand.companyName &&
                    !brand.fullName
                  ) {
                    failedRecords++;

                    report.push({
                      row: index + 1,
                      companyName:
                        brand.companyName,
                      fullName:
                        brand.fullName,
                      email:
                        brand.email,
                      officialEmail:
                        brand.officialEmail,
                      mobileNumber:
                        brand.mobileNumber,

                      status: "Failed",

                      reason:
                        "Company Name or Full Name is required",
                    });

                    return;
                  }

                  if (
                    !brand.officialEmail &&
                    !brand.mobileNumber
                  ) {
                    failedRecords++;

                    report.push({
                      row: index + 1,
                      companyName:
                        brand.companyName,
                      fullName:
                        brand.fullName,
                      email:
                        brand.email,
                      officialEmail:
                        brand.officialEmail,
                      mobileNumber:
                        brand.mobileNumber,

                      status: "Failed",

                      reason:
                        "Either  Official Email or Mobile Number is required",
                    });

                    return;
                  }

                  // ========================================
                  // FIND EXISTING BRAND
                  // ========================================

                  let existingBrand = null;

                  const email =
                    cleanEmail(brand.email);

                  const officialEmail =
                    cleanEmail(
                      brand.officialEmail
                    );

                  const mobileNumber =
                    cleanPhone(
                      brand.mobileNumber
                    );

                  const linkedinProfile =
                    cleanText(
                      brand.linkedinProfile
                    ).toLowerCase();

                  const websiteUrl =
                    cleanText(
                      brand.websiteUrl
                    ).toLowerCase();

                  if (!isFirstUpload) {
                    const conditions = [];

                    if (email) {
                      conditions.push({
                        email: {
                          $regex: `^${email}$`,
                          $options: "i",
                        },
                      });
                    }

                    if (officialEmail) {
                      conditions.push({
                        officialEmail: {
                          $regex:
                            `^${officialEmail}$`,
                          $options: "i",
                        },
                      });
                    }

                    if (mobileNumber) {
                      conditions.push({
                        mobileNumber:
                          mobileNumber,
                      });
                    }

                    if (linkedinProfile) {
                      conditions.push({
                        linkedinProfile: {
                          $regex:
                            `^${linkedinProfile}$`,
                          $options: "i",
                        },
                      });
                    }

                    if (websiteUrl) {
                      conditions.push({
                        websiteUrl: {
                          $regex:
                            `^${websiteUrl}$`,
                          $options: "i",
                        },
                      });
                    }

                    if (
                      conditions.length > 0
                    ) {
                      existingBrand =
                        await CsvBrand.findOne({
                          $or: conditions,
                        });
                    }
                  }

                  // ========================================
                  // EXISTING BRAND
                  // ========================================

                  if (existingBrand) {
                    let isUpdated = false;

                    const changedFields = [];

                    const compareFields = [
                      "companyName",
                      "fullName",
                      "prospects",
                      "email",
                      "officialEmail",
                      "mobileNumber",
                      "linkedinProfile",
                      "city",
                      "address",
                      "directors",
                      "ageOfCompany",
                      "websiteUrl",
                      "dataType",
                      "status",
                    ];

                    compareFields.forEach(
                      (key) => {
                        let oldValue =
                          existingBrand[key];

                        let newValue =
                          brand[key];

                        if (
                          key ===
                            "email" ||
                          key ===
                            "officialEmail"
                        ) {
                          oldValue =
                            cleanEmail(
                              oldValue
                            );

                          newValue =
                            cleanEmail(
                              newValue
                            );
                        } else if (
                          key ===
                            "mobileNumber"
                        ) {
                          oldValue =
                            cleanPhone(
                              oldValue
                            );

                          newValue =
                            cleanPhone(
                              newValue
                            );
                        } else {
                          oldValue =
                            String(
                              oldValue || ""
                            )
                              .trim()
                              .toLowerCase();

                          newValue =
                            String(
                              newValue || ""
                            )
                              .trim()
                              .toLowerCase();
                        }

                        if (
                          oldValue !==
                          newValue
                        ) {
                          existingBrand[key] =
                            brand[key];

                          isUpdated = true;

                          changedFields.push(
                            key
                          );
                        }
                      }
                    );

                    // ========================================
                    // SAVE ONLY IF CHANGED
                    // ========================================

                    if (isUpdated) {
                      await existingBrand.save();

                      updatedRecords++;

                      report.push({
                        row: index + 1,

                        companyName:
                          brand.companyName,

                        fullName:
                          brand.fullName,

                        email:
                          brand.email,

                        officialEmail:
                          brand.officialEmail,

                        mobileNumber:
                          brand.mobileNumber,

                        status: "Updated",

                        reason:
                          `Updated fields: ${changedFields.join(
                            ", "
                          )}`,
                      });
                    } else {
                      report.push({
                        row: index + 1,

                        companyName:
                          brand.companyName,

                        fullName:
                          brand.fullName,

                        email:
                          brand.email,

                        officialEmail:
                          brand.officialEmail,

                        mobileNumber:
                          brand.mobileNumber,

                        status: "Skipped",

                        reason:
                          "No changes found",
                      });
                    }
                  }

                  // ========================================
                  // NEW BRAND
                  // ========================================

                  else {
                    await CsvBrand.create(
                      brand
                    );

                    successfulRecords++;

                    report.push({
                      row: index + 1,

                      companyName:
                        brand.companyName,

                      fullName:
                        brand.fullName,

                      email:
                        brand.email,

                      officialEmail:
                        brand.officialEmail,

                      mobileNumber:
                        brand.mobileNumber,

                      status: "Uploaded",

                      reason:
                        "New brand added",
                    });
                  }
                } catch (error) {
                  failedRecords++;

                  report.push({
                    row: index + 1,

                    companyName:
                      brand.companyName,

                    fullName:
                      brand.fullName,

                    email:
                      brand.email,

                    officialEmail:
                      brand.officialEmail,

                    mobileNumber:
                      brand.mobileNumber,

                    status: "Failed",

                    reason:
                      error.message,
                  });
                }
              })
            )
          );

          // ========================================
          // REPORT SIZE
          // ========================================

          const reportSize =
            Buffer.byteLength(
              JSON.stringify(report),
              "utf8"
            );

          console.log(
            "BRAND REPORT SIZE:",
            (
              reportSize /
              1024 /
              1024
            ).toFixed(2),
            "MB"
          );

          console.log(
            "BRAND REPORT ROWS:",
            report.length
          );

          // ========================================
          // SAVE REPORT
          // ========================================

          const savedReport =
            await CSVBrandUploadReport.create({
              fileName:
                req.file.originalname,

              totalRecords,

              successfulRecords,

              updatedRecords,

              failedRecords,

              report,
            });

          // ========================================
          // DELETE TEMP CSV
          // ========================================

          fs.unlink(
            req.file.path,
            () => {}
          );

          // ========================================
          // SOCKET UPDATE
          // ========================================

          if (io) {
            io.emit(
              "new-csv-brand"
            );
          }

          // ========================================
          // RESPONSE
          // ========================================

          return res.status(200).json({
            success: true,

            message:
              "Brand CSV uploaded successfully",

            reportId:
              savedReport._id,

            totalRecords,

            successfulRecords,

            updatedRecords,

            failedRecords,

            report,
          });
        } catch (error) {
          console.error(
            "BRAND INSERT ERROR:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              error.message,
          });
        }
      })

      .on("error", (error) => {
        console.error(
          "BRAND CSV READ ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            error.message,
        });
      });
  } catch (error) {
    console.error(
      "BRAND CSV MAIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ========================================
// UPDATE CSV BRAND
// ========================================


// ========================================
// UPDATE CSV BRAND STATUS
// ========================================

export const updateCsvBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Reachout",
      "Followup-1",
      "Followup-2",
      "Followup-3",
      "Nurture",
      "Interested",
      "Proposal Sent",
      "Negotiation",
      "Won",
      "Lost/Not Interested",
      "No Response",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const brand = await CsvBrand.findByIdAndUpdate(
      id,
      {
        status: status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "CSV brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand status updated successfully",
      data: brand,
    });

  } catch (error) {
    console.error(
      "UPDATE CSV BRAND ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update CSV brand",
      error: error.message,
    });
  }
};
// ========================================
// GET LATEST BRAND REPORT
// ========================================

export const getLatestCSVBrandReport =
  async (req, res) => {
    try {
      const report =
        await CSVBrandUploadReport.findOne()
          .sort({
            createdAt: -1,
          });

      if (!report) {
        return res.json({
          success: true,
          report: null,
          message:
            "No CSV brand report found",
        });
      }

      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


  // ========================================
// GET CSV BRANDS
// PAGINATION + SERVER SIDE FILTERING
// ========================================

export const getCsvBrands = async (req, res) => {
  try {
    const {
      companyName,
      fullName,
      prospects,
      email,
      officialEmail,
      mobileNumber,
      linkedinProfile,
      city,
      address,
      directors,
      ageOfCompany,
      websiteUrl,
      dataType,
      status,
      actionButton,
      editStatus,

      page = 1,
      limit = 100,
    } = req.query;

    // ========================================
    // FILTER OBJECT
    // ========================================

    const filter = {};

    // ========================================
    // COMPANY NAME
    // ========================================

    if (companyName?.trim()) {
      filter.companyName = {
        $regex: companyName.trim(),
        $options: "i",
      };
    }

    // ========================================
    // FULL NAME
    // ========================================

    if (fullName?.trim()) {
      filter.fullName = {
        $regex: fullName.trim(),
        $options: "i",
      };
    }

    // ========================================
    // PROSPECTS
    // ========================================

    if (prospects) {
  const selectedProspects = prospects
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedProspects.length > 0) {
    filter.prospects = {
      $in: selectedProspects,
    };
  }
}

    // ========================================
    // EMAIL
    // ========================================

    if (email?.trim()) {
      filter.email = {
        $regex: email.trim(),
        $options: "i",
      };
    }

    // ========================================
    // OFFICIAL EMAIL
    // ========================================

    if (officialEmail?.trim()) {
      filter.officialEmail = {
        $regex: officialEmail.trim(),
        $options: "i",
      };
    }

    // ========================================
    // MOBILE NUMBER
    // ========================================

    if (mobileNumber?.trim()) {
      filter.mobileNumber = {
        $regex: mobileNumber.trim(),
        $options: "i",
      };
    }

    // ========================================
    // LINKEDIN PROFILE
    // ========================================

    if (linkedinProfile?.trim()) {
      filter.linkedinProfile = {
        $regex: linkedinProfile.trim(),
        $options: "i",
      };
    }

    // ========================================
    // CITY
    // ========================================

    if (city?.trim()) {
      filter.city = {
        $regex: city.trim(),
        $options: "i",
      };
    }

    // ========================================
    // ADDRESS
    // ========================================

    if (address?.trim()) {
      filter.address = {
        $regex: address.trim(),
        $options: "i",
      };
    }

    // ========================================
    // DIRECTORS
    // ========================================

    if (directors?.trim()) {
      filter.directors = {
        $regex: directors.trim(),
        $options: "i",
      };
    }

    // ========================================
    // AGE OF COMPANY
    // ========================================

    // ========================================
// AGE OF COMPANY - MULTI SELECT
// ========================================

if (ageOfCompany) {
  const selectedAge = ageOfCompany
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedAge.length > 0) {
    filter.ageOfCompany = {
      $in: selectedAge,
    };
  }
}
    // ========================================
    // WEBSITE URL
    // ========================================

    if (websiteUrl?.trim()) {
      filter.websiteUrl = {
        $regex: websiteUrl.trim(),
        $options: "i",
      };
    }

    // ========================================
    // DATA TYPE
    // ========================================

    // ========================================
// DATA TYPE - MULTI SELECT
// ========================================

if (dataType) {
  const selectedDataTypes = dataType
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedDataTypes.length > 0) {
    filter.dataType = {
      $in: selectedDataTypes,
    };
  }
}
    // ========================================
    // STATUS
    // ========================================

    if (status) {
      filter.status = {
        $in: status
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    // ========================================
    // ACTION BUTTON
    // ========================================

    if (actionButton?.trim()) {
      filter.actionButton = {
        $regex: actionButton.trim(),
        $options: "i",
      };
    }

    // ========================================
    // EDIT STATUS
    // ========================================

    if (editStatus?.trim()) {
      filter.editStatus = {
        $regex: editStatus.trim(),
        $options: "i",
      };
    }

    // ========================================
    // TOTAL MATCHING RECORDS
    // ========================================

    const total =
      await CsvBrand.countDocuments(filter);

    // ========================================
    // DOWNLOAD ALL FILTERED BRANDS
    // ========================================

    if (req.query.download === "true") {
      const brands = await CsvBrand.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        total,
        data: brands,
      });
    }

    // ========================================
    // PAGINATION
    // ========================================

    const pageNumber =
      parseInt(page, 10) || 1;

    const limitNumber =
      parseInt(limit, 10) || 100;

    const skip =
      (pageNumber - 1) * limitNumber;

    // ========================================
    // FETCH BRANDS
    // ========================================

    const brands =
      await CsvBrand.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean();

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      total,

      page: pageNumber,

      limit: limitNumber,

      totalPages:
        Math.ceil(
          total / limitNumber
        ),

      data: brands,
    });

  } catch (error) {
    console.error(
      "GET CSV BRANDS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ========================================
// DELETE SINGLE CSV BRAND
// ========================================

export const deleteCsvBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand =
      await CsvBrand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Socket update
    if (io) {
      io.emit(
        "delete-csv-brand",
        id
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "CSV brand deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE CSV BRAND ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// DELETE ALL CSV BRANDS
// =====================================================

export const deleteAllCsvBrands = async (req, res) => {
  try {

    const result = await CsvBrand.deleteMany({});

    if (io) {
      io.emit("delete-all-csv-brands");
    }

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} brands deleted`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {

    console.error(
      "DELETE ALL CSV BRANDS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ========================================
// GET CSV BRAND FILTER OPTIONS
// ========================================

export const getCsvBrandFilterOptions = async (req, res) => {
  try {
    const [
      prospects,
      ageOfCompany,
      dataType,
      status,
    ] = await Promise.all([
      CsvBrand.distinct("prospects"),
      CsvBrand.distinct("ageOfCompany"),
      CsvBrand.distinct("dataType"),
      CsvBrand.distinct("status"),
    ]);

    // Remove empty/null values and sort
    const cleanOptions = (values) => {
      return values
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        )
        .map((value) => String(value).trim())
        .filter(
          (value, index, array) =>
            array.indexOf(value) === index
        )
        .sort((a, b) =>
          a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
    };

    return res.status(200).json({
      success: true,

      data: {
        prospects: cleanOptions(prospects),
        ageOfCompany: cleanOptions(ageOfCompany),
        dataType: cleanOptions(dataType),
        status: cleanOptions(status),
      },
    });

  } catch (error) {
    console.error(
      "GET CSV BRAND FILTER OPTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};