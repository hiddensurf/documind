import React, { useState } from 'react';
import { Brain, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, onViewMindMap }) => {
  const isUser = message.role === 'user';
  
  // FIXED: Handle both snake_case (from backend) and camelCase (from frontend)
  const hasMindMap = message.has_mindmap || message.hasMindMap || false;
  const mermaidCode = message.mermaid_code || message.mermaidCode || null;
  const sources = message.sources || [];

  // Prepare content for readable paragraphs: insert paragraph breaks after sentence endings
  const normalizeContent = (text) => {
    if (typeof text !== 'string') return text;
    // Insert a blank line after sentence terminators when followed by a capital/number
    // but avoid breaking numbered list markers like "1. Text" — keep those intact.
    return text.replace(/(^|[^0-9])([.?!])\s+(?=[A-Z0-9])/g, '$1$2\n\n');
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d)) return ts;
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return ts;
    }
  };

  // Debug logging (kept minimal)
  console.log('ChatMessage render: hasMindMap=', hasMindMap, 'mermaid=', !!mermaidCode);
  const [showDetails, setShowDetails] = useState(false);

  // Detect raw/technical error patterns in content so we can abstract them for users
  const isRawError = typeof message.content === 'string' && /\{"error":|OpenRouter error|rate limit|rate\s*limit|401|403|500|quota|not found/i.test(message.content);

  if (isUser) {
    return (
      <div className="flex w-full justify-end mb-2">
        <div className="max-w-[72%]">
          <div className="flex flex-col items-end">
            <div className="mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-light-border dark:bg-dark-border">
                <User className="w-5 h-5 text-light-text dark:text-dark-text" />
              </div>
            </div>
            <div className="inline-block bg-light-sidebar dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-2xl p-3 shadow-soft text-right">
              <p className="whitespace-pre-wrap m-0 leading-relaxed">{message.content}</p>
            </div>
            <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">{formatTimestamp(message.timestamp)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 items-start`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500`}>
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className={`flex-1 space-y-2`}>
        <div className={`
            ${message.isError ? 'bg-red-500/10 border border-red-500/20 rounded-2xl p-4' : ''}
          `}>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 px-0 py-0 text-gray-800 dark:text-gray-100">
            {(message.isError || isRawError) ? (
              <div className="rounded-lg p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm">
                <div className="flex items-start gap-3">
                  <div className="text-red-600 dark:text-red-400 text-xl">⚠️</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Analysis failed</div>
                    <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">We couldn't complete the analysis. Please try again, check your API configuration, or try a different model.</div>
                    <div className="mt-3">
                      <button onClick={() => setShowDetails(s => !s)} className="text-sm text-primary-500 hover:underline">
                        {showDetails ? 'Hide details' : 'Show details'}
                      </button>
                    </div>
                    {showDetails && (
                      <pre className="mt-2 p-2 bg-light-border dark:bg-dark-border rounded text-xs overflow-auto whitespace-pre-wrap">{message.content}</pre>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="my-2 ml-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="my-2 ml-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-purple-500" {...props} />,
                    code: ({node, inline, ...props}) => {
                      const text = Array.isArray(props.children) ? props.children.join('') : props.children;
                      const isShortSingleLine = !inline && typeof text === 'string' && text.length <= 40 && !text.includes('\n');
                      if (inline || isShortSingleLine) {
                        return <code className="inline-block px-1.5 py-0.5 bg-light-border dark:bg-dark-border rounded text-sm whitespace-nowrap" {...props} />;
                      }
                      return <code className="block p-3 bg-light-border dark:bg-dark-border rounded-lg text-sm overflow-x-auto" {...props} />;
                    },
                  }}
                >
                  {normalizeContent(message.content)}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="typing-cursor text-gray-800 dark:text-gray-100" aria-hidden="true" />
                )}
              </>
            )}
          </div>
        </div>

        {hasMindMap && mermaidCode && (
          <button
            onClick={() => onViewMindMap(mermaidCode)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            <Brain className="w-4 h-4" />
            View Mind Map
          </button>
        )}

        {sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-light-textSecondary dark:text-dark-textSecondary">Sources:</span>
            {sources.map((source, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">{source}</span>
            ))}
          </div>
        )}

        <div className="text-xs text-light-textSecondary dark:text-dark-textSecondary">{formatTimestamp(message.timestamp)}</div>
      </div>
    </div>
  );
};

export default ChatMessage;