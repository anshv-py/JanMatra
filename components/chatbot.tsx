'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your JanMatra assistant. I can help you understand your data, generate reports, and provide suggestions for policy improvements. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);

  const BOT_ENDPOINT = "http://localhost:8000/chatbot";

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setLoading(true);

    try {
      console.log('Sending request to:', BOT_ENDPOINT);
      console.log('Payload:', { prompt: currentMessage });

      const res = await fetch(BOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ prompt: currentMessage })
      });


      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      let answer = 'Sorry, I could not understand that.';
      
      if (data.response) {
        answer = data.response;
      } else if (data.error) {
        answer = `Error: ${data.error}`;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: answer,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, botMsg]);
      
    } catch (err: any) {
      console.error('Fetch error:', err);
      
      let errorMessage = 'Network error! Please try again.';
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Is it running on port 8000?';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error. Check server configuration.';
      } else if (err.message.includes('HTTP')) {
        errorMessage = err.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: errorMessage,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="group relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
            size="default"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Get AI Suggestions
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isExpanded ? 'w-96 h-[600px]' : 'w-80 h-96'
      }`}
    >
      <Card className="h-full shadow-2xl border-0 bg-white">
        <CardHeader className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">JanMatra Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                Online
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.type === 'bot' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] p-3 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content.split('\n').map((line, index) => (
                    <div key={index}>
                      {line}
                      {index < msg.content.split('\n').length - 1 && <br />}
                    </div>
                  ))}
                </div>

                {msg.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="max-w-[70%] p-3 rounded-lg text-sm bg-white text-gray-800 rounded-bl-none shadow-sm">
                  <span className="italic text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your data, reports, or get suggestions..."
                className="flex-1 text-sm"
                disabled={loading}
              />
              <Button type="submit" size="sm" disabled={!message.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-2 flex flex-wrap gap-1">
              {[
                'Generate report',
                'Explain sentiment',
                'Show trends',
                'Policy suggestions'
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessage(suggestion)}
                  className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-100"
                  disabled={loading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
