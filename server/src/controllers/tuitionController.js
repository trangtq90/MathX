import { prisma } from "../config/db.js";

export const getTuitions = async (req, res) => {
  try {
    const tuitions = await prisma.tuition.findMany();
    res.json(tuitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrUpdateTuition = async (req, res) => {
  const { id, ...data } = req.body;
  try {
    // 1. Nếu có ID hợp lệ, update trực tiếp
    if (id && !id.startsWith("new_")) {
      const existing = await prisma.tuition.findUnique({ where: { id } });
      if (existing) {
        const updated = await prisma.tuition.update({ where: { id }, data });
        return res.json(updated);
      }
    }

    // 2. Check trùng lặp (1 học sinh - 1 tháng chỉ có 1 record)
    const existingByMonth = await prisma.tuition.findFirst({
      where: { studentId: data.studentId, month: data.month },
    });

    if (existingByMonth) {
      const updated = await prisma.tuition.update({
        where: { id: existingByMonth.id },
        data,
      });
      return res.json(updated);
    }

    // 3. Tạo mới
    const created = await prisma.tuition.create({ data });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};