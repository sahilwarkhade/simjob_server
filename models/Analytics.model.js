import { model, Schema } from "mongoose";

const analyticsSchema = new Schema({
  userId: {
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  totalMockInterviews: {
    type: Number,
  },
  totalOaTests: {
    type: Number,
  },
  averageMockScore: {
    type: Number,
  },
  averageOaScore: {
    type: Number,
  },
  weakPoints: {
    type: String,
  },
  strongPoints: {
    type: String,
  },
  imporvedPoints: {
    type: String,
  },
  improvementSuggestions: {
    type: String,
  },
});

export default model("Analytics", analyticsSchema);
