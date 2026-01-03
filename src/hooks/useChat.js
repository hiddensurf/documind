import { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessage as apiSendMessage, runAdvancedAnalysis, runHybridAnalysis, runVisionQuery } from '../services/api';

export function useChat(conversationId, documentIds = []) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const streamTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      // cleanup any pending timers on unmount
      streamTimersRef.current.forEach((t) => clearTimeout(t));
      streamTimersRef.current = [];
    };
  }, []);

  const clearStreaming = useCallback(() => {
    streamTimersRef.current.forEach((t) => clearTimeout(t));
    streamTimersRef.current = [];
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  }, []);

  const streamAssistant = useCallback((text, meta = {}) => {
    clearStreaming();
    const timestamp = meta.timestamp || new Date().toISOString();
    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp,
      isStreaming: true,
      ...meta
    };
    setMessages(prev => [...prev, assistantMessage]);

    const chars = Array.from(text || '');
    let idx = 0;
    const speed = 18; // ms per chunk
    const chunk = 3; // characters per step

    const step = () => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant' || !last.isStreaming) return prev;
        const nextContent = last.content + chars.slice(idx, idx + chunk).join('');
        const newLast = { ...last, content: nextContent };
        return [...prev.slice(0, -1), newLast];
      });

      idx += chunk;
      if (idx < chars.length) {
        const t = setTimeout(step, speed);
        streamTimersRef.current.push(t);
      } else {
        // finalize
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (!last) return prev;
          const final = { ...last, content: text, isStreaming: false };
          return [...prev.slice(0, -1), final];
        });
      }
    };

    step();
  }, [clearStreaming]);

  const sendMessage = useCallback(async (query) => {
    if (!conversationId) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiSendMessage(conversationId, query, documentIds);
      
      // progressively stream assistant response
      streamAssistant(response.response || response.message?.content || '', {
        timestamp: response.timestamp,
        hasMindmap: response.hasMindmap,
        mermaidCode: response.mermaidCode,
        sources: response.sources || []
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, documentIds]);

  const sendAdvancedAnalysis = useCallback(async (query, modelId = null) => {
    if (!conversationId) return;

    const userMessage = {
      role: 'user',
      content: `✨ Run 5-Stage Analysis: ${query}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await runAdvancedAnalysis(conversationId, query, documentIds, modelId);
      
      streamAssistant(response.message?.content || response.response || '', {
        timestamp: response.message?.timestamp || new Date().toISOString(),
        sources: response.sources || []
      });
    } catch (error) {
      console.error('Error running advanced analysis:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, there was an error running the advanced vision analysis. ${error.message || 'Please try again.'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, documentIds]);

  const sendVisionQuery = useCallback(async (query) => {
    if (!conversationId) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await runVisionQuery(conversationId, query, documentIds);
      
      streamAssistant(response.message?.content || response.response || '', {
        timestamp: response.message?.timestamp || new Date().toISOString(),
        sources: response.sources || []
      });
    } catch (error) {
      console.error('Error running vision query:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, there was an error. ${error.response?.data?.detail || error.message || 'Please run 5-stage analysis first.'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, documentIds]);

  const sendHybridAnalysis = useCallback(async (query, modelId = null) => {
    if (!conversationId) return;

    const userMessage = {
      role: 'user',
      content: `🤖 Hybrid AI Analysis: ${query}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await runHybridAnalysis(conversationId, query, documentIds, modelId);
      
      streamAssistant(response.message?.content || response.response || '', {
        timestamp: response.message?.timestamp || new Date().toISOString(),
        sources: response.sources || []
      });
    } catch (error) {
      console.error('Error running hybrid analysis:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, there was an error running the hybrid analysis. ${error.message || 'Please try again.'}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, documentIds]);

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    sendAdvancedAnalysis,
    sendVisionQuery,
    sendHybridAnalysis
  };
}
