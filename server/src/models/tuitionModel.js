import mongoose from "mongoose";

const tuitionSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // Có thể dùng mongoose.Schema.Types.ObjectId nếu muốn strict relation
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  datePaid: { type: String },
  method: { type: String },
  note: { type: String } // Ghi chú thêm
}, { timestamps: true });

tuitionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

export const Tuition = mongoose.model("Tuition", tuitionSchema);