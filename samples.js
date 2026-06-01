import { ChatGroq } from "@langchain/groq";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as dotenv from "dotenv";
dotenv.config();

// Simple embedding function — converts text to numbers
function textToVector(text) {
  const vec = new Array(384).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 384] += text.charCodeAt(i);
  }
  return vec;
}

// Similarity check between two vectors
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Step 1 — load PDF
console.log("⏳ Loading PDF...");
const loader = new PDFLoader("./sample.pdf");
const docs = await loader.load();
console.log("✅ PDF loaded! Pages:", docs.length);

// Step 2 — chunk it
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});
const chunks = await splitter.splitDocuments(docs);
console.log("✅ Chunks created:", chunks.length);

// Step 3 — convert chunks to vectors
console.log("⏳ Creating embeddings...");
const vectorStore = chunks.map(chunk => ({
  content: chunk.pageContent,
  vector: textToVector(chunk.pageContent)
}));
console.log("✅ Vector store ready!");

// Step 4 — search by question
function search(question, topK = 2) {
  const questionVector = textToVector(question);
  return vectorStore
    .map(item => ({
      content: item.content,
      score: cosineSimilarity(questionVector, item.vector)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Step 5 — ask a question
const question = "What is RAG with memory architecture?";
console.log("\n🔍 Question:", question);

const relevantChunks = search(question);
console.log("\n📄 Most relevant chunks:");
relevantChunks.forEach((r, i) => {
  console.log(`\nChunk ${i + 1} (score: ${r.score.toFixed(3)}):`);
  console.log(r.content.slice(0, 200));
});

// Step 6 — send to Groq AI
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,

    model: "llama-3.3-70b-versatile"
});

const context = relevantChunks.map(r => r.content).join("\n\n");
const prompt = `Use this context to answer the question.
  
Context:
${context}

Question: ${question}

Answer:`;

console.log("\n⏳ Asking Groq AI...");
const response = await llm.invoke(prompt);
console.log("\n🤖 AI Answer:", response.content);