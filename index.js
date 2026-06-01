import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

import connectDB from "./server/config/db.js";
import uploadRouter from "./server/routes/uploads.js";
import askRouter from "./server/routes/ask.js";
import pdfsRouter from "./server/routes/pdf.js";
import chatsRouter from "./server/routes/chat.js";

// Connect MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────
app.use("/upload", uploadRouter);
app.use("/ask", askRouter);
app.use("/pdfs", pdfsRouter);
app.use("/chats", chatsRouter);

// ─── Health check ─────────────────────────────────
app.get("/", (req, res) => {
  res.json({ 
    status: "✅ DocuChat API running",
    endpoints: [
      "POST /upload",
      "POST /ask",
      "GET /pdfs",
      "DELETE /pdfs",
      "GET /chats",
      "GET /chats/:sessionId",
      "DELETE /chats/:sessionId"
    ]
  });
});

// ─── Start ────────────────────────────────────────
app.listen(3000, () => {
  console.log("\n🚀 DocuChat running on http://localhost:3000");
  console.log("📤 POST /upload — upload PDF");
  console.log("💬 POST /ask   — ask question");
  console.log("📚 GET  /chats — chat history\n");
});