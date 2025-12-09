import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Fallback URI nếu không có biến môi trường (cho môi trường dev local)
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mathx_db");
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};