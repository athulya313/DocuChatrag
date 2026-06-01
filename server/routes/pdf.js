import express from "express";
import { ChromaClient } from "chromadb";

const router = express.Router();

const chroma = new ChromaClient({
  path: "http://localhost:8000"
});

// Get all PDFs
router.get("/", async (req, res) => {
  try {
    let collection;
    try {
      collection = await chroma.getCollection({
        name: "docuchat",
        embeddingFunction: null,
      });
    } catch (e) {
      return res.json({ success: true, pdfs: [] });
    }

    const data = await collection.get({
      include: ["metadatas"]
    });

    const pdfs = [...new Set(
      data.metadatas
        .filter(m => m?.filename)
        .map(m => m.filename)
    )];

    res.json({ success: true, pdfs });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all PDFs
router.delete("/", async (req, res) => {
  try {
    await chroma.deleteCollection({ name: "docuchat" });
    res.json({
      success: true,
      message: "All PDFs cleared!"
    });
  } catch (e) {
    res.json({
      success: true,
      message: "Nothing to clear"
    });
  }
});

export default router;