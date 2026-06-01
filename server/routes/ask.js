import express from "express";
import { ChatGroq } from "@langchain/groq";
import { ChromaClient } from "chromadb";
import { textToVector } from "../utils/embeddings.js";
import Chat from "../models/Chat.js";

const router = express.Router();

const chroma = new ChromaClient({
  path: "http://localhost:8000"
});

router.post("/", async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required"
      });
    }

    console.log("\n🔍 Question:", question);

    // Get collection
    let collection;
    try {
      collection = await chroma.getCollection({
        name: "docuchat",
        embeddingFunction: null,
      });
    } catch (e) {
      return res.status(400).json({
        error: "Please upload a PDF first"
      });
    }

    const count = await collection.count();
    if (count === 0) {
      return res.status(400).json({
        error: "Please upload a PDF first"
      });
    }

    // Convert question to vector
    const questionVector = await textToVector(question);

    // Search ChromaDB
    const results = await collection.query({
      queryEmbeddings: [questionVector],
      nResults: 3,
      include: ["documents", "metadatas", "distances"]
    });

    console.log("📄 Chunks found:", 
      results.documents[0].length);

    const context = results.documents[0].join("\n\n");

    // Build sources
    const sources = results.metadatas[0]
      .map((meta, i) => ({
        filename: meta?.filename || "Unknown",
        page: meta?.page || 0,
        score: (1 - results.distances[0][i]).toFixed(3)
      }))
      .filter(src => src.filename !== "Unknown");

    // Ask Groq
    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
    });

    const prompt = `You are a helpful assistant.
Answer ONLY using the context below.
Be specific and detailed.
If not found say: "I couldn't find that in the document."

Context:
${context}

Question: ${question}

Answer:`;

    const response = await llm.invoke(prompt);
    console.log("✅ Answer generated!");

    // ─── Save to MongoDB ───────────────────────────
    if (sessionId) {
      let chat = await Chat.findOne({ sessionId });

      if (!chat) {
        chat = new Chat({
          sessionId,
          title: question.slice(0, 60),
          messages: []
        });
      }

      chat.messages.push({
        role: "user",
        text: question
      });

      chat.messages.push({
        role: "ai",
        text: response.content,
        sources
      });

      await chat.save();
      console.log("💾 Saved to MongoDB!");
    }

    res.json({
      success: true,
      question,
      answer: response.content,
      sources,
      chunksUsed: results.documents[0].length,
    });

  } catch (error) {
    console.error("❌ Ask error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;