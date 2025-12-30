import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import checklistRoutes from "./routes/checklistRoutes";
import { startEmailWorker } from "./jobs/emailWorker";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/checklist", checklistRoutes);

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