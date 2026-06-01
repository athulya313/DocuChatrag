import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

// Get all chat sessions
router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find()
      .select("sessionId title createdAt")
      .sort({ createdAt: -1 });
    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get one chat session
router.get("/:sessionId", async (req, res) => {
  try {
    const chat = await Chat.findOne({
      sessionId: req.params.sessionId
    });
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      });
    }
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a chat session
router.delete("/:sessionId", async (req, res) => {
  try {
    await Chat.deleteOne({
      sessionId: req.params.sessionId
    });
    res.json({
      success: true,
      message: "Chat deleted!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;