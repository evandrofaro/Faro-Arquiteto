import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetConversation, 
  useSendMessage, 
  useCreateConversation, 
  getGetConversationQueryKey,
  getListConversationsQueryKey,
  useListModels,
  useGetSettings,
  Message
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Send, FileCode2, Copy, Check, TerminalSquare, Compass, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Simple markdown block parser
function parseMarkdown(content: string) {
  const parts = [];
  const regex = /```([\w-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }
  return parts;
}

function CodeBlock({ language, code }: { language: string, code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-md overflow-hidden border border-primary/30">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#050F17] border-b border-primary/20">
        <span className="text-xs text-primary/70 font-mono">{language || 'text'}</span>
        <button 
          onClick={handleCopy}
          className="text-primary/70 hover:text-primary transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-[#050F17] overflow-x-auto text-sm text-foreground/90 font-mono leading-relaxed">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%] bg-card border border-card-border p-4 rounded-2xl rounded-tr-sm shadow-sm">
          {message.fileContext && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2 py-1.5 rounded-md mb-2 w-fit border border-primary/20">
              <FileCode2 className="w-3.5 h-3.5" />
              Attached context
            </div>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const parts = parseMarkdown(message.content);

  return (
    <div className="flex justify-start mb-6 w-full">
      <div className="max-w-full w-full">
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 mb-2">
                {part.content}
              </div>
            );
          }
          return <CodeBlock key={i} language={part.language!} code={part.content} />;
        })}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-6 w-full">
      <div className="flex items-center gap-1.5 p-4 rounded-2xl">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] neon-glow"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] neon-glow"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce neon-glow"></div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [match, params] = useRoute("/c/:id");
  const [, setLocation] = useLocation();
  const id = match ? Number(params?.id) : null;

  const queryClient = useQueryClient();
  
  const { data: conversation, isLoading } = useGetConversation(id!, {
    query: { enabled: !!id, queryKey: getGetConversationQueryKey(id!) }
  });

  const { data: models } = useListModels();
  const { data: settings } = useGetSettings();

  const createConvo = useCreateConversation();
  const sendMsg = useSendMessage();

  const [input, setInput] = useState("");
  const [fileContext, setFileContext] = useState<{path: string, content: string} | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for passed file context from GitHub
  useEffect(() => {
    const ctx = sessionStorage.getItem("farobot_file_context");
    if (ctx) {
      try {
        setFileContext(JSON.parse(ctx));
        sessionStorage.removeItem("farobot_file_context");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, sendMsg.isPending]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !fileContext) return;
    
    const content = input.trim();
    const ctxString = fileContext ? `File: ${fileContext.path}\n\n${fileContext.content}` : null;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (!id) {
      // Create conversation first
      const model = settings?.defaultModel || (models?.[0]?.id ?? "hf-model");
      
      createConvo.mutate({ data: { title: content.slice(0, 30) || "Code Review", model } }, {
        onSuccess: (newConvo) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          
          sendMsg.mutate({ 
            id: newConvo.id, 
            data: { content, fileContext: ctxString } 
          }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(newConvo.id) });
              setLocation(`/c/${newConvo.id}`);
              setFileContext(null);
            }
          });
        }
      });
    } else {
      // Send to existing
      sendMsg.mutate({
        id,
        data: { content, fileContext: ctxString }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(id) });
          setFileContext(null);
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render empty state
  if (!id && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 neon-border shadow-[0_0_40px_rgba(57,255,20,0.15)]">
            <Zap className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">How can I help you code today?</h1>
          <p className="text-muted-foreground text-center">FaroBot Studio is your private, AI-powered engineering assistant.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
          {[
            { title: "Review Code", desc: "Analyze my React components for performance issues", icon: <Code className="w-5 h-5 text-primary" /> },
            { title: "Debug Errors", desc: "Find the memory leak in my Node.js service", icon: <TerminalSquare className="w-5 h-5 text-primary" /> },
            { title: "Architecture", desc: "Suggest a database schema for a messaging app", icon: <Compass className="w-5 h-5 text-primary" /> }
          ].map((s, i) => (
            <button 
              key={i}
              onClick={() => setInput(s.desc)}
              className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all group"
            >
              <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity">{s.icon}</div>
              <h3 className="font-medium text-foreground text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </button>
          ))}
        </div>

        <div className="w-full max-w-3xl mt-auto">
          {fileContext && (
            <div className="mb-3 inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-xs font-medium">
              <FileCode2 className="w-4 h-4" />
              Attached: {fileContext.path}
              <button onClick={() => setFileContext(null)} className="ml-2 hover:text-white">&times;</button>
            </div>
          )}
          <div className="relative border border-input bg-card rounded-2xl focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all p-2 shadow-sm">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message FaroBot..."
              className="min-h-[52px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 text-foreground py-3 px-3 shadow-none scrollbar-hide"
              rows={1}
            />
            <div className="flex justify-between items-center px-2 pb-2">
              <div className="text-xs text-muted-foreground ml-2">
                Shift + Return for new line
              </div>
              <Button 
                onClick={handleSend}
                disabled={(!input.trim() && !fileContext) || sendMsg.isPending || createConvo.isPending}
                size="icon" 
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full flex flex-col">
          {conversation?.messages?.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {sendMsg.isPending && <TypingIndicator />}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border z-10">
        <div className="max-w-4xl mx-auto w-full">
          {fileContext && (
            <div className="mb-3 inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-xs font-medium">
              <FileCode2 className="w-4 h-4" />
              Attached: {fileContext.path}
              <button onClick={() => setFileContext(null)} className="ml-2 hover:text-white">&times;</button>
            </div>
          )}
          <div className="relative border border-input bg-card rounded-2xl focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all p-2 shadow-sm">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Reply to FaroBot..."
              className="min-h-[52px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 text-foreground py-3 px-3 shadow-none scrollbar-hide"
              rows={1}
            />
            <div className="flex justify-between items-center px-2 pb-2">
              <div className="text-xs text-muted-foreground ml-2">
                Shift + Return for new line
              </div>
              <Button 
                onClick={handleSend}
                disabled={(!input.trim() && !fileContext) || sendMsg.isPending}
                size="icon" 
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
