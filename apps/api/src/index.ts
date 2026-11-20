import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import checklistRoutes from "./routes/checklistRoutes";
import adminRoutes from "./routes/adminRoutes";
import liveSessionRoutes from "./routes/liveSessionRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import couponRoutes from "./routes/couponRoutes";
import funnelRoutes from "./routes/funnelRoutes";
import { runEmailWorkerOnce, startEmailWorker } from "./jobs/emailWorker";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g., 'http://localhost:5173'
  credentials: false // Not needed for token-based auth
}));
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Called by Vercel Cron (see vercel.json); Vercel sends "Authorization: Bearer <CRON_SECRET>".
app.get("/api/cron/send-notifications", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    res.json({ sent: await runEmailWorkerOnce() });
  } catch (error: any) {
    console.error("Cron send-notifications error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/live-sessions", liveSessionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/funnel", funnelRoutes);


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