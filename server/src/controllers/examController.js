import { Exam } from "../models/examModel.js";

export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    // Mongoose trả về JSON object thuần, không cần parse string như SQLite
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExam = async (req, res) => {
  // MongoDB lưu thẳng Array/Object, không cần stringify 'questions'
  try {
    const { id, ...data } = req.body; // Bỏ id client gửi nếu có
    const exam = await Exam.create(data);
    res.status(201).json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExam = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findByIdAndUpdate(id, req.body, { new: true });
    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  const { id } = req.params;
  try {
    await Exam.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};