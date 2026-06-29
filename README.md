# DocuChat — RAG Document Intelligence

A multi-PDF question answering system built 
with a complete RAG pipeline using LangChain, 
ChromaDB, and Groq LLaMA.

## Features

- Upload multiple PDF documents
- Ask questions across all documents simultaneously
- Per-answer source attribution — shows which 
  document and section answered your question
- Conversation history with session management
- Drag and drop PDF upload interface

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** React.js
- **RAG Pipeline:** LangChain.js
- **Embeddings:** HuggingFace all-MiniLM-L6-v2 (384-dim)
- **Vector Store:** ChromaDB
- **LLM:** Groq LLaMA 3.1
- **Database:** MongoDB (conversation history)

## RAG Pipeline

\`\`\`
PDF Upload
    ↓
LangChain PDF Ingestion
    ↓
RecursiveCharacterTextSplitter
(300 char chunks, 50 char overlap)
    ↓
HuggingFace Embeddings (384-dim vectors)
    ↓
ChromaDB Vector Storage
    ↓
User asks question
    ↓
Question → Embedding → ChromaDB Search
    ↓
Top 5 relevant chunks retrieved
    ↓
Chunks + Question → Groq LLaMA
    ↓
Answer with source attribution
\`\`\`

## Getting Started

\`\`\`bash
git clone https://github.com/athulya313/docuchat

npm install

cp .env.example .env

npm run dev
\`\`\`

## Environment Variables

\`\`\`
MONGO_URI=your_mongodb_url
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_hf_key
\`\`\`
