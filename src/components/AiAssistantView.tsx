import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Layers,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Terminal,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NavItem } from './Layout.tsx';

interface AiAssistantViewProps {
  onNavigate: (tab: NavItem) => void;
}

interface Message {
  sender: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  toolResults?: any[];
  timestamp: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      content: `Hello Sarah, I'm **SME Intelligence**, your dedicated business operational advisor.

I have direct access to your live PostgreSQL database, including sales transactions, warehouse inventory, vendor catalogs, and categorized expenses.

You can ask me any question or choose one of the primary business diagnostics below:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    { text: 'What should I consider purchasing this week?', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
    { text: 'Why did my profit decrease?', icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> },
    { text: 'Which products are at risk of running out?', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'What are my biggest business risks?', icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> },
    { text: 'What are my best-selling products?', icon: <Layers className="w-3.5 h-3.5 text-blue-400" /> },
  ];

  async function handleSendMessage(queryText?: string) {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatAi(textToSend);
      const assistantMsg: Message = {
        sender: 'assistant',
        content: res.reply,
        toolsUsed: res.toolsUsed,
        toolResults: res.toolResults,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          content: `Unable to complete query: ${err.message || 'Server error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderFormattedContent(text: string) {
    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {text.split('\n\n').map((paragraph, pIdx) => {
          if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
            return (
              <h3 key={pIdx} className="text-sm font-bold text-white border-b border-slate-800 pb-1 mt-3 first:mt-0">
                {paragraph.replace(/^#+\s*/, '')}
              </h3>
            );
          }
          if (paragraph.startsWith('#### ')) {
            return (
              <h4 key={pIdx} className="text-xs font-bold text-cyan-300 uppercase tracking-wider mt-2">
                {paragraph.replace(/^#+\s*/, '')}
              </h4>
            );
          }

          const lines = paragraph.split('\n');
          return (
            <div key={pIdx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim());
                const cleanLine = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');

                const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

                return (
                  <div key={lIdx} className={isBullet ? 'flex items-start gap-1.5 pl-2' : ''}>
                    {isBullet && <span className="text-cyan-400 mt-1 text-[10px]">•</span>}
                    <p className="flex-1 text-slate-200">
                      {parts.map((part, partIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={partIdx} className="font-semibold text-white">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return part;
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Title Banner */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <span>AI Business Intelligence Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise tool-grounded reasoning without arbitrary SQL exposure
          </p>
        </div>
      </div>

      {/* Suggested Demonstration Prompts */}
      <div className="shrink-0 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Suggested Demonstrations:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1424] border border-slate-800 hover:border-cyan-500/50 hover:bg-[#121c32] text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm"
          >
            {q.icon}
            <span>{q.text}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-blue-950/80 text-cyan-400 border border-blue-800/60'
              }`}
            >
              {msg.sender === 'user' ? 'U' : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : ''}`}>
              {/* Tool Execution Badges */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Backend Tools Executed:</span>
                  </span>
                  {msg.toolsUsed.map((tool, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-cyan-300 border border-blue-800/60"
                    >
                      {tool}()
                    </span>
                  ))}
                </div>
              )}

              {/* Message Box */}
              <div
                className={`p-4 rounded-3xl ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md text-xs'
                    : 'bg-[#090d16] border border-slate-800 rounded-tl-xs text-slate-200'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                ) : (
                  renderFormattedContent(msg.content)
                )}
              </div>

              <span className="text-[10px] text-slate-500 px-1 block">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-950 text-cyan-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-[#090d16] rounded-2xl border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Querying database tools and generating grounded analysis...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 flex items-center gap-2 bg-[#0d1424] p-2 border border-slate-800 rounded-2xl shadow-lg"
      >
        <input
          type="text"
          placeholder="Ask a question about sales, inventory velocity, or procurement risks..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 text-xs focus:outline-none bg-transparent text-slate-100 placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
