// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import * as dotenv from "dotenv";

// dotenv.config();

// // Load PDF
// const loader = new PDFLoader("./sample.pdf");

// const docs = await loader.load();

// console.log("✅ PDF loaded! Total pages:", docs.length);

// // Split into chunks
// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 500,
//   chunkOverlap: 50,
// });

// const chunks = await splitter.splitDocuments(docs);

// console.log("✅ Total chunks:", chunks.length);

// console.log("📄 First chunk preview:");
// console.log(chunks[0].pageContent);



import { HfInference } from "@huggingface/inference";
import * as dotenv from "dotenv";
dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);

const e1 = await hf.featureExtraction({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  inputs: "What is Standard RAG?",
});

const e2 = await hf.featureExtraction({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  inputs: "Standard RAG is the baseline setup for retrieval augmented generation",
});

console.log("E1 length:", e1.length);
console.log("E1 first value:", e1[0]);
console.log("E2 length:", e2.length);
console.log("E2 first value:", e2[0]);