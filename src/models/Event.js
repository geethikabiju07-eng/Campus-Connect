import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, required: true, enum: ["Workshop", "Seminar", "Cultural", "Sports", "Technical", "Other"] },
  venue: { type: String, required: true, trim: true, maxlength: 160 },
  date: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1, max: 50000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

eventSchema.index({ date: 1, category: 1 });
export default mongoose.model("Event", eventSchema);
