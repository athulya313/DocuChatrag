import express from "express";
import multer from "multer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChromaClient } from "chromadb";
import { textToVector } from "../utils/embeddings.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => 
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

const chroma = new ChromaClient({
  path: "http://localhost:8000"
});

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    console.log("\n📄 PDF received:", req.file.originalname);

    // Load PDF
    const loader = new PDFLoader(req.file.path);
    const docs = await loader.load();
    console.log("✅ Pages loaded:", docs.length);

    // Chunk it
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 50,
    });
    const chunks = await splitter.splitDocuments(docs);
    console.log("✅ Chunks created:", chunks.length);

    // Get or create collection
    let collection;
    try {
      collection = await chroma.getCollection({
        name: "docuchat",
        embeddingFunction: null,
      });
    } catch (e) {
      collection = await chroma.createCollection({
        name: "docuchat",
        embeddingFunction: null,
      });
    }

    const existingCount = await collection.count();

    console.log("⏳ Creating embeddings...");
    const ids = [];
    const embeddings = [];
    const documents = [];
    const metadatas = [];

    for (let i = 0; i < chunks.length; i++) {
      const vector = await textToVector(
        chunks[i].pageContent
      );
      ids.push(`chunk_${existingCount + i}`);
      embeddings.push(vector);
      documents.push(chunks[i].pageContent);
      metadatas.push({
        filename: req.file.originalname,
        page: chunks[i].metadata?.loc?.pageNumber || 0,
        chunkIndex: existingCount + i
      });
      process.stdout.write(".");

      // Avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas
    });

    console.log("\n✅ Stored in ChromaDB!");

    const totalCount = await collection.count();

    res.json({
      success: true,
      message: "PDF processed successfully!",
      chunks: chunks.length,
      totalChunks: totalCount,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;