import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  uploadDate: { type: String, required: true },
  url: { type: String },
  size: { type: String },
  grade: { type: String },
  content: { type: String } // Base64 string
}, { timestamps: true });

documentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

export const Document = mongoose.model("Document", documentSchema);