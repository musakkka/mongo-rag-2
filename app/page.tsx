'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    content: string;
    score: number;
  }>;
  usage?: any;
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hey there 👋\nHow can i help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRAGMode, setIsRAGMode] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const BotAvatar = () => (
    <svg 
      className="bot-avatar"
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      viewBox="0 0 1024 1024"
    >
      <path
        d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
      />
    </svg>
  );

  const ChatbotLogo = () => (
    <svg 
      className="chatbot-logo"
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      viewBox="0 0 1024 1024"
    >
      <path
        d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
      />
    </svg>
  );

  const ThinkingIndicator = () => (
    <div className="thinking-indicator">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      const endpoint = isRAGMode ? '/api/rag' : '/api/chat';
      const requestBody = isRAGMode 
        ? {
            question: currentInput
          }
        : {
            message: currentInput,
            conversationHistory: messages
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: isRAGMode ? data.answer : data.response,
        timestamp: new Date(),
        sources: data.sources,
        usage: data.usage
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleFileUpload = () => {
    // File upload logic would go here
    console.log('File upload clicked');
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className={isOpen ? 'show-chatbot' : ''}>
      {/* Chatbot Toggle Button */}
      <button 
        id="chatbot-toggler"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined">mode_comment</span>
        <span className="material-symbols-rounded">close</span>
      </button>

      {/* Chatbot Popup */}
      <div className="chatbot-popup">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-info">
            <ChatbotLogo />
            <h2 className="logo-text">Chatbot</h2>
            <div className="mode-indicator">
              <span className={`mode-badge ${isRAGMode ? 'rag-mode' : 'chat-mode'}`}>
                {isRAGMode ? 'RAG' : 'Chat'}
              </span>
            </div>
          </div>
          <div className="header-controls">
            <button 
              id="mode-toggle"
              className={`mode-toggle ${isRAGMode ? 'rag-active' : 'chat-active'}`}
              onClick={() => setIsRAGMode(!isRAGMode)}
              title={`Switch to ${isRAGMode ? 'Chat' : 'RAG'} mode`}
            >
              {isRAGMode ? '💬' : '🔍'}
            </button>
            <button 
              id="close-chatbot"
              className="material-symbols-rounded"
              onClick={() => setIsOpen(false)}
            >
              keyboard_arrow_down
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="chat-body" ref={chatBodyRef}>
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}-message`}>
              {message.type === 'bot' && <BotAvatar />}
              <div className="message-content">
                <div className="message-text">
                   {message.content.split('\n').map((line, index) => {
                    // Handle bullet points
                    if (line.trim().startsWith('- ')) {
                      const bulletLine = line.replace('- ', '• ');
                      // Handle bold text within bullet points
                      const formattedLine = bulletLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <div key={index} className="bullet-point" dangerouslySetInnerHTML={{ __html: formattedLine }} />
                      );
                    }
                    // Handle bold text
                    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return (
                      <div key={index} dangerouslySetInnerHTML={{ __html: boldLine }} />
                    );
                  })}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="sources-section">
                    <div className="sources-header">
                      <span className="sources-label">📚 Sources:</span>
                    </div>
                    <div className="sources-list">
                      {message.sources.map((source, index) => (
                        <div key={index} className="source-item">
                          <div className="source-title">{source.title}</div>
                          <div className="source-content">
                            {source.content.length > 100 
                              ? `${source.content.substring(0, 100)}...` 
                              : source.content
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot-message thinking">
              <BotAvatar />
              <div className="message-content">
                <div className="message-text">
                  <ThinkingIndicator />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Footer */}
        <div className="chat-footer">
          <form className="chat-form" onSubmit={handleSendMessage}>
            <textarea
              ref={messageInputRef}
              placeholder="Message..."
              className="message-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              required
            />
            <div className="chat-controls">
              <button 
                type="button" 
                id="emoji-picker" 
                className="material-symbols-rounded"
                onClick={toggleEmojiPicker}
              >
                sentiment_satisfied
              </button>
              <div className="file-upload-wrapper">
                <input type="file" accept="image/*" id="file-input" hidden />
                <button 
                  type="button" 
                  id="file-upload" 
                  className="material-symbols-rounded"
                  onClick={handleFileUpload}
                >
                  attach_file
                </button>
              </div>
              <button 
                type="submit" 
                id="send-message" 
                className="material-symbols-rounded"
                style={{ display: inputValue.trim() ? 'block' : 'none' }}
              >
                arrow_upward
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
