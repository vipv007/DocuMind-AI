"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "ai";
  content: string;
  sources?: { content: string; source: string }[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello! I'm DocuMind AI. Upload a document (PDF or TXT) via the sidebar, and then ask me any questions about it."
    }
  ]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- CHAT HISTORY LOGIC ---
  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("documind_chat_history");
    const savedFiles = localStorage.getItem("documind_uploaded_files");
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
    
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error("Failed to parse uploaded files history");
      }
    }
  }, []);

  // Save to localStorage whenever messages or files change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if it's just the welcome message
      localStorage.setItem("documind_chat_history", JSON.stringify(messages));
    }
    localStorage.setItem("documind_uploaded_files", JSON.stringify(uploadedFiles));
  }, [messages, uploadedFiles]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Send raw file to server api route!
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadedFiles(prev => [...prev, file.name]);
      setMessages(prev => [...prev, {
        role: "ai",
        content: `✅ Successfully processed "${file.name}" — ${data.chunksProcessed} chunks created. You can now ask me questions about it!`
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This will remove its vectors from the knowledge base.`)) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete file");

      setUploadedFiles(prev => prev.filter(f => f !== filename));
      setMessages(prev => [...prev, {
        role: "ai",
        content: `🗑️ Removed "${filename}" from the knowledge base.`
      }]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKB = async () => {
    if (!confirm("Are you sure you want to clear the entire knowledge base? This will delete all uploaded document vectors.")) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear");

      setUploadedFiles([]);
      setMessages(prev => [...prev, {
        role: "ai",
        content: "🧹 Knowledge base has been cleared. I no longer have access to previous documents."
      }]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chat failed");
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const encoder = new TextDecoder();
      let accumulatedContent = "";
      let sources: any[] = [];
      let sourcesExtracted = false;

      // Add initial AI placeholder
      setMessages(prev => [...prev, { role: "ai", content: "", sources: [] }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = encoder.decode(value);
        
        if (!sourcesExtracted) {
          // Check for separator
          const sepIndex = chunk.indexOf("\n--SEP--\n");
          if (sepIndex !== -1) {
            const sourcesJSON = chunk.substring(0, sepIndex);
            try {
              const parsed = JSON.parse(sourcesJSON);
              sources = parsed.sources;
            } catch (e) {}
            
            accumulatedContent += chunk.substring(sepIndex + 9);
            sourcesExtracted = true;
          } else {
            // Still waiting for sources or separator was split across chunks
            // (Simplification: we assume first chunk or two contains the small JSON)
             accumulatedContent += chunk; 
          }
        } else {
          accumulatedContent += chunk;
        }

        // Update the last message (AI response)
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          newMessages[lastIdx] = { 
            ...newMessages[lastIdx], 
            content: accumulatedContent,
            sources: sources 
          };
          return newMessages;
        });
      }

    } catch (error: any) {
       setMessages(prev => [...prev, { 
        role: "ai", 
        content: `Sorry, I encountered an error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">⚡</div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>DocuMind</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>RAG Intelligence</p>
          </div>
        </div>

        <button 
          onClick={() => {
            if (confirm("Start a new chat? This will clear the current conversation history.")) {
              setMessages([{
                role: "ai",
                content: "Hello! I'm DocuMind AI. Upload a document (PDF or TXT) via the sidebar, and then ask me any questions about it."
              }]);
              localStorage.removeItem("documind_chat_history");
            }
          }}
          className="new-chat-btn"
          style={{ marginBottom: "24px" }}
        >
          <span>+</span> New Chat
        </button>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Knowledge Base</h3>
            {uploadedFiles.length > 0 && (
              <button 
                onClick={handleClearKB}
                className="clear-btn"
                title="Clear all documents"
              >
                Clear All
              </button>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: "none" }} 
            accept=".pdf,.txt"
            onChange={handleFileUpload}
          />
          
          <div 
            className="upload-zone" 
            onClick={() => fileInputRef.current?.click()}
            style={{ opacity: isUploading ? 0.5 : 1 }}
          >
            <div className="upload-icon">{isUploading ? "⏳" : "📄"}</div>
            <div className="upload-title">
              {isUploading ? "Processing..." : "Upload Document"}
            </div>
            <div className="upload-subtitle">PDF or TXT (Max 100MB)</div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Uploaded Files</h3>
            {uploadedFiles.map((name, i) => (
              <div key={i} className="file-item">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, overflow: "hidden" }}>
                  <span style={{ color: "var(--brand)" }}>📄</span>
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{name}</span>
                </div>
                <button 
                  className="file-delete-btn"
                  onClick={() => handleDeleteFile(name)}
                  title="Delete file"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: "auto", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Powered by Next.js, LangChain & Gemini
        </div>
      </aside>

      <main className="main-chat">
        <header className="chat-header">
          <h2>Project Workspace</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            {uploadedFiles.length === 0 
              ? "Upload a document to get started" 
              : `${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''} loaded`}
          </p>
        </header>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message fade-in ${msg.role}`}>
              <div className={`avatar ${msg.role}`}>
                {msg.role === "ai" ? "AI" : "U"}
              </div>
              <div className="message-content">
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <details className="sources-details">
                    <summary className="sources-summary">
                      <span>📌 View Sources ({msg.sources.length})</span>
                    </summary>
                    <div className="sources-container fade-in">
                      {msg.sources.map((src, idx) => (
                        <div key={idx} className="source-card">
                          <header style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                            <span style={{color: "var(--brand)", fontWeight: 600}}>Source #{idx + 1}</span>
                            <span style={{ color: "#71717a", fontSize: "0.75rem" }}>{src.source}</span>
                          </header>
                          <div className="source-text">{src.content}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai">
              <div className="avatar ai">AI</div>
              <div className="message-content">
                <div className="typing-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form className="input-box" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={isLoading || isUploading}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading || isUploading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
