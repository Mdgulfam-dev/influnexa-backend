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
  },
  { timestamps: true }
);

export default mongoose.model(
  "BrandTicketCreator",
  brandTicketCreatorSchema
);