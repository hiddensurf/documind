import { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessage as apiSendMessage, runAdvancedAnalysis, runHybridAnalysis, runVisionQuery } from '../services/api';

export function useChat(conversationId, documentIds = []) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      // cleanup any running timers on unmount
      timersRef.current.forEach(t => clearInterval(t));
      timersRef.current = [];
    };
  }, []);

  const streamAssistant = (fullText, meta = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const chunkSize = 24; // chars per tick
    const tick = 22; // ms between ticks — fast but readable

    setMessages(prev => [...prev, { id, role: 'assistant', content: '', timestamp: new Date().toISOString(), ...meta }]);

    let pos = 0;
    const interval = setInterval(() => {
      pos = Math.min(pos + chunkSize, fullText.length);
      const slice = fullText.slice(0, pos);
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, content: slice } : m)));
      if (pos >= fullText.length) {
        clearInterval(interval);
        // remove interval from ref
        timersRef.current = timersRef.current.filter(t => t !== interval);
      }
    }, tick);

    timersRef.current.push(interval);
  };

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
      
      // stream assistant text progressively for better UX
      streamAssistant(response.response || response.message?.content || '', {
        timestamp: response.timestamp || new Date().toISOString(),
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
