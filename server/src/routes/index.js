import express from "express";
import studentRouter from "./studentRouter.js";
import tuitionRouter from "./tuitionRouter.js";
import examRouter from "./examRouter.js";
import documentRouter from "./documentRouter.js";

const router = express.Router();

router.use("/students", studentRouter);
router.use("/tuition", tuitionRouter);
router.use("/exams", examRouter);
router.use("/documents", documentRouter);

export default router;