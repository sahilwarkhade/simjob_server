import { model, Schema } from "mongoose";

const analyticsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalMockInterviews: { type: Number, default: 0 },
    totalOaTests: { type: Number, default: 0 },
    averageMockScore: { type: Number, default: 0 },
    averageOaScore: { type: Number, default: 0 },

    weakPoints: [{ type: String }],
    strongPoints: [{ type: String }],
    improvedPoints: [{ type: String }],
    improvementSuggestions: [{ type: String }],
  },
  { timestamps: true }
);

analyticsSchema.index({ user: 1 });

export default model("Analytics", analyticsSchema);
