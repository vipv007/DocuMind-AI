# 🧠 DocuMind AI — RAG Document Q&A System

Upload any PDF or TXT document and ask questions about it. The AI answers **only from your document** with source citations.

---

## 📋 Prerequisites (முதல்ல install பண்ணு)

| Tool | Version | Download Link |
|------|---------|---------------|
| **Node.js** | v18+ | [https://nodejs.org](https://nodejs.org) |
| **npm** | v9+ | Comes with Node.js |
| **Google Gemini API Key** | Free | [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

### Check if already installed:
```bash
node --version
npm --version
```

---

## 🚀 Step-by-Step Build Guide (படிப்படியா செய்)

### Step 1: Open Terminal in VS Code

```
File → Open Folder → D:\DocuMind-AI
```

Then open terminal: **Ctrl + `** (backtick key)

---

### Step 2: Install Dependencies

```bash
npm install
```

This will install all packages listed in `package.json`. Wait until it finishes (~2-3 minutes).

If you see **peer dependency errors**, run:
```bash
npm install --legacy-peer-deps
```

---

### Step 3: Set Up Your API Key

Open the file `.env.local` in the project root and add your Gemini API key:

```env
GOOGLE_API_KEY=AIzaSy_YOUR_KEY_HERE
```

> ⚠️ **Important:** Don't share this key or commit it to GitHub!

**How to get a free Gemini API key:**
1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key and paste it in `.env.local`

---

### Step 4: Run the Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.x.x
  - Local: http://localhost:3000
  ✓ Ready
```

---

### Step 5: Open in Browser

Go to: **http://localhost:3000**

---

## 🎮 How to Use (எப்படி use பண்றது)

### 1. Upload a Document
- Click the **"Upload Document"** box on the left sidebar
- Select a **PDF** or **TXT** file
- Wait for the success message (it will show how many chunks were processed)

### 2. Ask Questions
- Type your question in the chat box at the bottom
- Press Enter or click the Send button
- The AI will answer **only from your uploaded document**
- You'll see **source citations** below each answer

### 3. Upload More Documents
- You can upload multiple documents
- The AI will search across ALL uploaded documents

---

## 📁 Project Structure (Code எங்க இருக்கு)

```
D:\DocuMind-AI\
│
├── src/
│   ├── app/
│   │   ├── page.tsx              ← 🖥️ Main UI (Chat Interface)
│   │   ├── layout.tsx            ← 📐 Root Layout
│   │   ├── globals.css           ← 🎨 All Styles
│   │   │
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts      ← 📤 File Upload API
│   │       └── chat/
│   │           └── route.ts      ← 💬 RAG Chat API
│   │
│   └── lib/
│       ├── gemini.ts             ← 🤖 Gemini LLM Client
│       └── rag/
│           ├── embeddings.ts     ← 🔢 Text → Numbers (Embeddings)
│           ├── chunker.ts        ← ✂️ Split text into chunks
│           ├── vectorStore.ts    ← 💾 In-Memory Vector Database
│           └── chain.ts          ← 🔗 RAG Chain (Retrieval + Generation)
│
├── .env.local                    ← 🔑 API Key (SECRET - don't share!)
├── package.json                  ← 📦 Dependencies list
├── tsconfig.json                 ← ⚙️ TypeScript config
└── next.config.ts                ← ⚙️ Next.js config
```

---

## 🧠 How RAG Works (RAG எப்படி வேலை செய்யுது)

```
Step 1: UPLOAD
   PDF/TXT file
       ↓
   Extract text from file
       ↓
   Split into small chunks (1000 chars each)
       ↓
   Convert chunks to embeddings (numbers)
       ↓
   Store in Vector Database ✅

Step 2: ASK QUESTION
   "What is the main topic?"
       ↓
   Convert question to embedding
       ↓
   Search Vector DB for similar chunks
       ↓
   Get top 4 most relevant chunks
       ↓
   Send chunks + question to Gemini AI
       ↓
   AI generates answer FROM the chunks ✅
```

### Key Concepts:

| Concept | Simple Explanation |
|---------|-------------------|
| **Embedding** | Converting text into a list of numbers so the computer can compare similarity |
| **Vector Store** | A database that stores embeddings and can quickly find similar ones |
| **Chunking** | Splitting a big document into small pieces (1000 characters each) |
| **Similarity Search** | Finding which chunks are most related to your question |
| **RAG Chain** | The pipeline that connects retrieval → prompt → LLM → answer |

---

## 🛠️ Tech Stack

| Technology | What it does |
|-----------|-------------|
| **Next.js 14** | React framework (frontend + backend) |
| **TypeScript** | JavaScript with types (safer code) |
| **LangChain.js** | RAG framework (industry standard) |
| **Gemini 1.5 Flash** | Google's AI model (LLM) |
| **text-embedding-004** | Google's embedding model |
| **MemoryVectorStore** | In-memory vector database |
| **pdf-parse** | Extract text from PDF files |

---

## ❌ Common Errors & Fixes

### Error: `GOOGLE_API_KEY is not set`
```
Fix: Check .env.local file has your API key
     Make sure the file is named exactly ".env.local" (not ".env")
     Restart the dev server after changing the key
```

### Error: `npm install` fails
```
Fix: Run with legacy peer deps:
     npm install --legacy-peer-deps
```

### Error: `Port 3000 is already in use`
```
Fix: Use a different port:
     npx next dev -p 3001
```

### Error: `Cannot find module 'pdf-parse'`
```
Fix: Install it manually:
     npm install pdf-parse --legacy-peer-deps
```

### Upload works but chat gives error
```
Fix: Make sure your Gemini API key is valid and has quota
     Test at: https://aistudio.google.com/
```

---

## 🚀 Production Build (Optional)

To create an optimized production build:

```bash
npm run build
npm start
```

---

## 📚 Learn More

- [LangChain.js Docs](https://js.langchain.com/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [RAG Explained (YouTube)](https://www.youtube.com/results?search_query=RAG+explained+simple)

---

## 💡 Future Improvements

- [ ] Add ChromaDB for persistent vector storage
- [ ] Support more file types (DOCX, CSV)
- [ ] Add streaming responses
- [ ] Web URL scraping (paste a link, chat with it)
- [ ] Multi-user support with authentication
- [ ] Deploy to Vercel

---

Built with ❤️ using Next.js + LangChain + Gemini AI
