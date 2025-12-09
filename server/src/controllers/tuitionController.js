import { Tuition } from "../models/tuitionModel.js";

export const getTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.find();
    res.json(tuitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrUpdateTuition = async (req, res) => {
  const { id, ...data } = req.body;
  try {
    // 1. Nếu có ID hợp lệ (không phải temp ID new_...), update trực tiếp
    if (id && !id.startsWith("new_") && mongoose.Types.ObjectId.isValid(id)) {
      const updated = await Tuition.findByIdAndUpdate(id, data, { new: true });
      if (updated) return res.json(updated);
    }

    // 2. Check trùng lặp (1 học sinh - 1 tháng chỉ có 1 record)
    const existingByMonth = await Tuition.findOne({
      studentId: data.studentId,
      month: data.month,
    });

    if (existingByMonth) {
      const updated = await Tuition.findByIdAndUpdate(
        existingByMonth._id,
        data,
        { new: true }
      );
      return res.json(updated);
    }

    // 3. Tạo mới
    const created = await Tuition.create(data);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
import mongoose from "mongoose"; // Import cần thiết cho check ObjectId
