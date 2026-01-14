import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import checklistRoutes from "./routes/checklistRoutes";
import adminRoutes from "./routes/adminRoutes";
import liveSessionRoutes from "./routes/liveSessionRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import { startEmailWorker } from "./jobs/emailWorker";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g., 'http://localhost:5173'
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/live-sessions", liveSessionRoutes);
app.use("/api/payments", paymentRoutes);


if (process.env.NODE_ENV === "DEVELOPMENT") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start email worker for processing scheduled emails
    startEmailWorker();
  });
} else {
  // In production, start the worker regardless
  startEmailWorker();
}

export default app;