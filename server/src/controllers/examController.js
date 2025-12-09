import { prisma } from "../config/db.js";

export const getExams = async (req, res) => {
  try {
    const exams = await prisma.exam.findMany();
    // Parse JSON string -> Object
    const parsedExams = exams.map((e) => ({
      ...e,
      questions: JSON.parse(e.questions),
    }));
    res.json(parsedExams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExam = async (req, res) => {
  const { questions, id, ...rest } = req.body;
  const dataToSave = { ...rest, questions: JSON.stringify(questions) };
  try {
    const exam = await prisma.exam.create({ data: dataToSave });
    res.status(201).json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExam = async (req, res) => {
  const { id } = req.params;
  const { questions, ...rest } = req.body;
  const dataToSave = { ...rest, questions: JSON.stringify(questions) };
  try {
    const exam = await prisma.exam.update({ where: { id }, data: dataToSave });
    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.exam.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};