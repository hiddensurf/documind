import React, { useState, useMemo } from 'react';
import { Brain, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const isRawError = (text) => {
  if (!text) return false;
  return /Traceback|Exception:|Error:|stack trace|\{\"|\"message\"/i.test(text);
};

const normalizeParagraphs = (text) => {
  if (!text) return text || '';
  // Normalize CRLF to LF
  const s = String(text).replace(/\r\n/g, '\n');
  // Insert paragraph breaks for single newlines except when the next line is a list or numbered item
  // Use a function replacement to avoid accidental $n placeholders being treated as literals.
  return s.replace(/([^\n])\n(?!\s*(?:\d+\.|[-*+]\s))/g, (match, p1) => `${p1}\n\n`);
};

const ChatMessage = ({ message, onViewMindMap }) => {
  const isUser = message.role === 'user';
  const [showDetails, setShowDetails] = useState(false);

  const hasMindMap = message.has_mindmap || message.hasMindMap || false;
  const mermaidCode = message.mermaid_code || message.mermaidCode || null;
  const sources = message.sources || [];

  const formattedTimestamp = useMemo(() => {
    try { return new Date(message.timestamp).toLocaleString(); } catch(e){ return message.timestamp; }
  }, [message.timestamp]);

  const contentIsRawError = isRawError(message.content) || message.isError;

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-light-border dark:bg-dark-border' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-light-text dark:text-dark-text" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </div>

      <div className="flex flex-col items-start max-w-[78%]">
        <div className={`${isUser ? 'self-end' : 'self-start'} space-y-2` }>
          {/* Assistant (unboxed) or User (subtle right-aligned bubble) */}
          {isUser ? (
            <div className="inline-block bg-purple-50/40 dark:bg-purple-900/30 border border-purple-200/30 dark:border-purple-800/40 px-3 py-2 rounded-lg text-sm leading-relaxed">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3">
              {contentIsRawError ? (
                <div className="bg-red-50/30 dark:bg-red-900/20 border border-red-400/20 rounded-lg p-3 text-sm">
                  <div className="font-semibold text-red-600">An internal error occurred while processing the request.</div>
                  <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-2">You can retry or view technical details below.</div>
                  <button
                    onClick={() => setShowDetails(s => !s)}
                    className="mt-3 text-xs text-purple-600 hover:underline"
                  >{showDetails ? 'Hide details' : 'Show details'}</button>
                  {showDetails && (
                    <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs overflow-auto whitespace-pre-wrap">{message.content}</pre>
                  )}
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="my-2 ml-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="my-2 ml-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-purple-600" {...props} />,
                    code: ({node, inline, children, ...props}) => {
                      const text = String(children || '');
                      if (inline && text.length < 60 && !text.includes('\n')) {
                        return <code className="px-1.5 py-0.5 bg-light-border dark:bg-dark-border rounded text-xs" {...props}>{children}</code>;
                      }
                      return <code className="block p-3 bg-light-border dark:bg-dark-border rounded-lg text-sm overflow-x-auto" {...props}>{children}</code>;
                    }
                  }}
                >
                  {normalizeParagraphs(message.content)}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Mind Map button */}
          {hasMindMap && mermaidCode && (
            <button
              onClick={() => onViewMindMap && onViewMindMap(mermaidCode)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:brightness-105"
            >
              <Brain className="w-4 h-4" />
              View Mind Map
            </button>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-light-textSecondary dark:text-dark-textSecondary">Sources:</span>
              {sources.map((s, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-purple-100/30 rounded-lg">{s}</span>
              ))}
            </div>
          )}

          <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">{formattedTimestamp}</div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;