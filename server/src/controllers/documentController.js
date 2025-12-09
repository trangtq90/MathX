import { prisma } from "../config/db.js";

export const getDocuments = async (req, res) => {
  try {
    const docs = await prisma.document.findMany();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDocument = async (req, res) => {
  const { id, ...data } = req.body;
  try {
    const doc = await prisma.document.create({ data });
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await prisma.document.update({
      where: { id },
      data: req.body,
    });
    res.json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.document.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};