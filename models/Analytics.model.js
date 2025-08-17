import { model, Schema } from "mongoose";

const analyticsSchema = new Schema({
  user: {
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
},{timestamps:true});

export default model("Analytics", analyticsSchema);
