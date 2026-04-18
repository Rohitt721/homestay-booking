import mongoose from "mongoose";

const savedTripSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  destination: { type: String, required: true },
  planData: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SavedTrip = mongoose.model("SavedTrip", savedTripSchema);

export default SavedTrip;
