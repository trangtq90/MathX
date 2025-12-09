import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  id: String,
  content: String,
  options: [String],
  correctAnswer: String,
  type: String
}, { _id: false });

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  grade: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  questions: [questionSchema], // Mongoose hỗ trợ mảng object trực tiếp
  createdBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

examSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

export const Exam = mongoose.model("Exam", examSchema);