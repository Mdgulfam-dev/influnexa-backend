import mongoose from "mongoose";

const leadWorkflowSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    completedBy: {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
        index: true,
      },
    },

    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Main aggregation index.
 * This is important because your CSV data is large.
 */
leadWorkflowSchema.index({
  "completedBy.name": 1,
  status: 1,
});

leadWorkflowSchema.index({
  completedAt: -1,
});

leadWorkflowSchema.index(
  {
    leadId: 1,
    status: 1,
  },
  {
    unique: true,
  }
);

const LeadWorkflow = mongoose.model(
  "LeadWorkflow",
  leadWorkflowSchema
);

export default LeadWorkflow;