import express from "express";
import multer from "multer";
import cors from "cors";
import { ChatGroq } from "@langchain/groq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// ─── SMARTER LOCAL EMBEDDING ─────────────────────
function textToVector(text) {
  const vec = new Array(384).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach((word, wordIndex) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      vec[(charCode * 31 + wordIndex) % 384] += 1;
      vec[(charCode + i * 7) % 384] += 0.5;
      vec[(wordIndex * 13 + i) % 384] += 0.3;
    }
  });
  
  // normalize
  const magnitude = Math.sqrt(
    vec.reduce((sum, v) => sum + v * v, 0)
  );
  return vec.map(v => v / (magnitude || 1));
}

// ─── COSINE SIMILARITY ───────────────────────────
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── IN-MEMORY VECTOR STORE ──────────────────────
let vectorStore = [];

// ─── ROUTE 1: Upload PDF ─────────────────────────
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    console.log("📄 PDF received:", req.file.originalname);

    // Load PDF
    const loader = new PDFLoader(req.file.path);
    const docs = await loader.load();
    console.log("✅ Pages loaded:", docs.length);

    // Chunk it
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const chunks = await splitter.splitDocuments(docs);
    console.log("✅ Chunks created:", chunks.length);

    // Convert each chunk to vector
    console.log("⏳ Creating embeddings...");
    vectorStore = [];

    for (const chunk of chunks) {
      const vector = textToVector(chunk.pageContent);
      vectorStore.push({
        content: chunk.pageContent,
        vector: vector
      });
      process.stdout.write(".");
    }

    console.log("\n✅ All embeddings created!");

    res.json({
      success: true,
      message: `PDF processed! ${vectorStore.length} chunks ready.`,
      chunks: vectorStore.length
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ─── ROUTE 2: Ask a question ─────────────────────
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ 
        error: "Question is required" 
      });
    }

    if (vectorStore.length === 0) {
      return res.status(400).json({ 
        error: "Please upload a PDF first" 
      });
    }

    console.log("\n🔍 Question:", question);

    // Convert question to vector
    const questionVector = textToVector(question);

    // Find most relevant chunks
    const results = vectorStore
      .map(item => ({
        content: item.content,
        score: cosineSimilarity(questionVector, item.vector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log("📄 Top chunk score:", 
      results[0].score.toFixed(3));

    // Send to Groq AI
    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
    });

    const context = results
      .map(r => r.content)
      .join("\n\n");

    const prompt = `You are a helpful assistant.
Answer the question using only the context below.
If the answer is not in the context, say 
"I couldn't find that in the document."

Context:
${context}

Question: ${question}

Answer:`;

    const response = await llm.invoke(prompt);
    console.log("✅ Answer generated!");

    res.json({
      success: true,
      question,
      answer: response.content,
      chunksUsed: results.length
    });

  } catch (error) {
    console.error("❌ Ask error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ─── START SERVER ─────────────────────────────────
app.listen(3000, () => {
  console.log("\n🚀 DocuChat server running on http://localhost:3000");
  console.log("📤 POST /upload — upload a PDF");
  console.log("💬 POST /ask   — ask a question\n");
});