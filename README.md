# 🧠 DocuMind AI — Premium RAG Document Q&A

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![LangChain](https://img.shields.io/badge/LangChain-JS-green?style=for-the-badge)](https://js.langchain.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-blue?style=for-the-badge)](https://ai.google.dev/)

**DocuMind AI** is a state-of-the-art document intelligence system. Upload your PDFs or TXT files and have a conversation with your data. No hallucination, just facts.

---

## ⚡ Quick Start (ஒரே நிமிஷத்துல ஆரம்பிக்க)

If you are on **Windows**, simply double-click the `setup.bat` file or run it in your terminal:

```powershell
.\setup.bat
```

This will:
1. ✅ Check your Node.js version.
2. ✅ Install all dependencies automatically.
3. ✅ Create your `.env.local` template.

---

## 🚀 Manual Setup (படிப்படியா செய்ய)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment
Create a `.env.local` file in the root and add:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```
> Get your free key at [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.

---

## 🎮 How to Use (எப்படி use பண்றது)

1. **Upload**: Click the sidebar box and select a PDF/TXT.
2. **Process**: Wait a few seconds for the AI to "read" your document.
3. **Chat**: Ask anything! The AI will answer with **citations** from the text.

---

## 📁 Project Structure (Code எங்க இருக்கு)

```
D:\DocuMind-AI\
│
├── src/app/api/        ← 🔌 Backend Routes (Upload & Chat)
├── src/lib/rag/        ← 🧠 RAG Logic (Embeddings, Chunker, Chain)
├── setup.bat           ← 🛠️ Automated Setup Script
├── .env.local          ← 🔑 API Keys (PRIVATE)
└── README.md           ← 📖 Documentation
```

---

## 🧠 How it Works (RAG Pipeline)

1. **Extraction**: Text is pulled from your PDF.
2. **Chunking**: Text is split into meaningful pieces.
3. **Embedding**: Pieces are converted into numerical vectors.
4. **Retrieval**: When you ask a question, we find the most relevant pieces.
5. **Generation**: Gemini AI writes an answer using ONLY those pieces.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI Orchestration**: LangChain.js
- **LLM**: Google Gemini 1.5 Flash
- **Embeddings**: Google text-embedding-004
- **Language**: TypeScript

---

Built with ❤️ by Antigravity AI
