'use client';

import { useState, useRef, useEffect } from 'react';
import { CircleUser, Send, RefreshCw } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
};

type CardResult = {
  id: string;
  name: string;
  imageUrl: string;
  set: string;
  number: string;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Pokémon TCG Rules Assistant. Ask me any question about card rules, card interactions, or specific cards!'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [cardResults, setCardResults] = useState<CardResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: input };
    const loadingMessage = { role: 'assistant' as const, content: '', loading: true };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setCardResults([]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Update the loading message with the actual response
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? { role: 'assistant', content: data.response } : msg
        )
      );
      
      // Set card results if any
      if (data.cardResults && data.cardResults.length > 0) {
        setCardResults(data.cardResults);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-base-200 p-4 max-w-6xl mx-auto">
      <div className="navbar bg-primary text-primary-content rounded-box mb-4">
        <div className="flex-1">
          {/* this is supposed to be a pokeball component */}
          <CircleUser className="mr-2" />
          <span className="text-xl font-bold">Pokémon TCG Rules Assistant</span>
        </div>
        <div className="flex-none">
          <button 
            className="btn btn-ghost btn-circle"
            onClick={() => {
              setMessages([
                {
                  role: 'assistant',
                  content: 'Hi! I\'m your Pokémon TCG Rules Assistant. Ask me any question about card rules, card interactions, or specific cards!'
                }
              ]);
              setCardResults([]);
            }}
          >
            <RefreshCw />
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto mb-4 p-4 bg-base-100 rounded-box">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'} mb-4`}
              >
                <div className="chat-bubble chat-bubble-lg bg-opacity-80 shadow-sm">
                  {message.loading ? (
                    <div className="flex justify-center">
                      <span className="loading loading-dots loading-md"></span>
                    </div>
                  ) : (
                    <div className="prose">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className="whitespace-pre-wrap mb-2">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Pokémon TCG rules or cards..."
              className="input input-bordered flex-1"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : <Send size={18} />}
            </button>
          </form>
        </div>
        
        {cardResults.length > 0 && (
          <div className="w-64 bg-base-100 p-4 rounded-box overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Card Results</h3>
            <div className="grid gap-4">
              {cardResults.map((card) => (
                <div key={card.id} className="card bg-base-200 shadow-md">
                  <figure>
                    <img src={card.imageUrl} alt={card.name} className="w-full object-contain" />
                  </figure>
                  <div className="card-body p-3">
                    <h4 className="card-title text-sm">{card.name}</h4>
                    <p className="text-xs">{card.set} · {card.number}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
