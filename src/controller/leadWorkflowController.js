import LeadWorkflow from "../models/LeadWorkflow.js";
import CsvBrand from "../models/CsvBrand.js";
// ============================================================
// STATUS KEY MAP
// Converts your database status into table-friendly keys
// ============================================================

const statusToKey = (status = "") => {
  const value = String(status).trim().toLowerCase();

  if (value === "pending") return "pending";

  if (
    value === "reachout" ||
    value === "reachout (day 1)" ||
    value === "reachout (day1)"
  ) {
    return "reachout";
  }

  if (
    value === "followup-1" ||
    value === "follow-up-1" ||
    value === "followup 1"
  ) {
    return "followup1";
  }

  if (
    value === "followup-2" ||
    value === "follow-up-2" ||
    value === "followup 2"
  ) {
    return "followup2";
  }

  if (
    value === "followup-3" ||
    value === "follow-up-3" ||
    value === "followup 3"
  ) {
    return "followup3";
  }

  if (
    value === "nurture" ||
    value === "nurture (day 18–30)" ||
    value === "nurture (day 18-30)"
  ) {
    return "nurture";
  }

  if (value === "interested") return "interested";
  if (value === "verified") return "verified";
  if (value === "proposal sent") return "proposalSent";
  if (value === "negotiation") return "negotiation";
  if (value === "won") return "won";
 if (
  value === "lost" ||
  value === "lost/not interested"
) {
  return "lost";
}
  if (value === "no response") return "noResponse";
  if (value === "not useful") return "notUseful";

  return value.replace(/[^a-z0-9]+(.)/g, (_, char) =>
    char ? char.toUpperCase() : ""
  );
};

// ============================================================
// GET BRAND WORKFLOW
// Returns workflow statistics grouped by lead/user
// ============================================================
export const getLeadWorkflow = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();

    // ============================================================
    // MATCH
    // ============================================================

    const match = {
  "completedBy.name": {
    $exists: true,
    $nin: ["", null],
  },

  "completedBy.email": {
    $exists: true,
    $nin: ["", null],
  },
};


    if (status) {
      match.status = status;
    }

    if (search) {
      match.$or = [
        {
          "completedBy.name": {
            $regex: search,
            $options: "i",
          },
        },
        {
          "completedBy.email": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ============================================================
    // TOTAL LEADS
    // ============================================================

    const totalResult = await CsvBrand.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: {
            email: {
              $ifNull: ["$completedBy.email", ""],
            },
          },
        },
      },

      {
        $count: "total",
      },
    ]);

    const total = totalResult[0]?.total || 0;

    // ============================================================
    // CURRENT STATUS PER LEAD
    // ============================================================

    const skip = (page - 1) * limit;

    const leads = await CsvBrand.aggregate([
      {
        $match: match,
      },

      // ----------------------------------------------------------
      // GROUP BRANDS BY CURRENT LEAD
      // ----------------------------------------------------------

      {
        $group: {
          _id: {
  email: "$completedBy.email",
  name: "$completedBy.name",
},

          // Store CURRENT brand statuses
          statuses: {
            $push: "$status",
          },

          // Number of brands currently assigned/completed
          totalBrands: {
            $sum: 1,
          },

          lastUpdatedAt: {
            $max: "$updatedAt",
          },
        },
      },

      {
        $sort: {
          lastUpdatedAt: -1,
        },
      },

      {
        $skip: skip,
      },

      {
        $limit: limit,
      },
    ]);

    // ============================================================
    // FORMAT LEADS
    // ============================================================

    const formattedLeads = leads.map((lead) => {
      const counts = {
        pending: 0,
        reachout: 0,
        followup1: 0,
        followup2: 0,
        followup3: 0,
        nurture: 0,
        interested: 0,
        verified: 0,
        proposalSent: 0,
        negotiation: 0,
        won: 0,
        lost: 0,
        noResponse: 0,
        notUseful: 0,
      };

      // ----------------------------------------------------------
      // IMPORTANT:
      // Each brand contributes ONLY ONE count:
      // its CURRENT status.
      // ----------------------------------------------------------

      for (const statusValue of lead.statuses || []) {
        const key = statusToKey(statusValue);

        if (
          Object.prototype.hasOwnProperty.call(
            counts,
            key
          )
        ) {
          counts[key] += 1;
        }
      }

      return {
        name: lead._id.name || "Unassigned",

        email: lead._id.email || "",

        totalCompleted: lead.totalBrands,

        lastCompletedAt: lead.lastUpdatedAt,

        ...counts,
      };
    });

    // ============================================================
    // GLOBAL CURRENT STATUS SUMMARY
    // ============================================================

    const summaryResult = await CsvBrand.aggregate([
      {

        $match: {
      "completedBy.name": {
        $exists: true,
        $nin: ["", null],
      },

      "completedBy.email": {
        $exists: true,
        $nin: ["", null],
      },
    },
  },
  {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const summary = {
      totalCompleted: 0,

      pending: 0,
      reachout: 0,
      followup1: 0,
      followup2: 0,
      followup3: 0,
      nurture: 0,
      interested: 0,
      verified: 0,
      proposalSent: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
      noResponse: 0,
      notUseful: 0,
    };

    for (const item of summaryResult) {
      const key = statusToKey(item._id);

      summary.totalCompleted += item.count;

      if (
        Object.prototype.hasOwnProperty.call(
          summary,
          key
        )
      ) {
        summary[key] += item.count;
      }
    }

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,

      data: {
        leads: formattedLeads,

        summary,

        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error(
      "GET LEAD WORKFLOW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch brand lead workflow.",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// CREATE WORKFLOW EVENT
// Call this whenever a brand lead completes a status
// ============================================================

export const createLeadWorkflow = async (req, res) => {
  try {
    // ----------------------------------------------------------
    // OWNER + ADMIN ONLY
    // ----------------------------------------------------------

    

    

    const {
      leadId,
      status,
      completedBy,
    } = req.body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "leadId is required.",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required.",
      });
    }

    if (!completedBy?.name && !completedBy?.email) {
      return res.status(400).json({
        success: false,
        message: "completedBy name or email is required.",
      });
    }

    // ----------------------------------------------------------
    // CREATE WORKFLOW RECORD
    // ----------------------------------------------------------

    const workflow = await LeadWorkflow.create({
      leadId,
      status: String(status).trim(),

      completedBy: {
        name: String(completedBy?.name || "").trim(),

        email: String(
          completedBy?.email || ""
        )
          .trim()
          .toLowerCase(),
      },

      completedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Brand workflow recorded successfully.",
      data: workflow,
    });
  } catch (error) {
    console.error(
      "CREATE LEAD WORKFLOW ERROR:",
      error
    );

    // Duplicate workflow status for same brand
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This status has already been recorded for this brand.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create brand workflow.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET WORKFLOW FOR ONE BRAND
// Useful when opening/viewing a particular brand
// ============================================================

export const getBrandWorkflow = async (req, res) => {
  try {
    

    

    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "leadId is required.",
      });
    }

    const workflow = await LeadWorkflow.find({
      leadId,
    })
      .sort({
        completedAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error(
      "GET BRAND WORKFLOW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch brand workflow.",
    });
  }
};