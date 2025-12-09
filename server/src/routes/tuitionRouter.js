import express from "express";
import {
  getTuitions,
  createOrUpdateTuition,
} from "../controllers/tuitionController.js";

const router = express.Router();

router.get("/", getTuitions);
router.post("/", createOrUpdateTuition);

export default router;