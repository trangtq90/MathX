import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  avatar: { type: String },
  grade: { type: String, required: true },
  startDate: { type: String, required: true },
  status: { type: String, required: true },
  phone: { type: String },
  parentName: { type: String }
}, { timestamps: true });

// Tự động chuyển _id thành id khi trả về JSON
studentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

export const Student = mongoose.model("Student", studentSchema);