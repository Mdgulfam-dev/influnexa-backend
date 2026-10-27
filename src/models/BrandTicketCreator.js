import mongoose from "mongoose";

const brandTicketCreatorSchema = new mongoose.Schema(
  {
    brandTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BrandTicket",
      required: true,
    },

    creatorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CsvCreator",
      },
    ],

     creatorDetails: [
      {
        creatorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CsvCreator",
          required: true,
        },

        status: {
          type: String,
          enum: [
            "",
            "Approved",
            "Rejected",
            "Pending",
            "On-Discussion",
          ],
          default: "",
        },

        readyToCampaign: {
          type: String,
          enum: ["", "Agreed", "Disagreed"],
          default: "",
        },

        commercial: {
          type: String,
          default: "",
        },
        quoteCommercial: {
  type: String,
  default: "",
},

      },
    ],

  },
  { timestamps: true }
);

export default mongoose.model(
  "BrandTicketCreator",
  brandTicketCreatorSchema
);