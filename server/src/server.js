import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Tăng limit để nhận file upload lớn (Base64 string)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes API
app.use("/api", routes);

const PORT = process.env.PORT || 4000;

// Kết nối DB trước khi chạy Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("❌ Kết nối đến database thất bại:", error);
  });