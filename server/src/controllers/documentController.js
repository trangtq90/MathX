import { Document } from "../models/documentModel.js";

export const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const doc = await Document.create(data);
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Document.findByIdAndUpdate(id, req.body, { new: true });
    res.json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await Document.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};