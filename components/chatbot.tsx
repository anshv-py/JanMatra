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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your JanMatra assistant. I can help you understand your data, generate reports, and provide suggestions for policy improvements. How can I assist you today?',
      timestamp: new Date()
    }
  ]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('report') || lowerMessage.includes('generate')) {
      return 'I can help you generate comprehensive reports! You can create reports from the Reports section. Would you like me to guide you through the process or suggest which type of report might be most useful for your current data?';
    }
    
    if (lowerMessage.includes('sentiment') || lowerMessage.includes('analysis')) {
      return 'Based on your current data, sentiment analysis shows 67.3% positive feedback. The strongest positive sentiment is in Healthcare (78%) and Environmental policies (82%). Would you like me to explain any specific trends or suggest areas for improvement?';
    }
    
    if (lowerMessage.includes('data') || lowerMessage.includes('feedback')) {
      return 'Your platform currently has 2,847 total feedback responses across 24 active regulations. The response rate is 89.2% with high engagement. Would you like me to break down the data by specific topics or time periods?';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return 'I can assist with: \n• Generating and interpreting reports\n• Explaining sentiment analysis results\n• Providing policy improvement suggestions\n• Navigating platform features\n• Analyzing trends and patterns\n\nWhat would you like to explore?';
    }
    
    return 'I understand you\'re asking about policy feedback analysis. Based on your current data trends, I\'d recommend focusing on the positive momentum in healthcare and environmental policies while addressing concerns in economic policies. Would you like specific recommendations or data insights?';
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
          
          {/* Hover tooltip */}
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Get AI Suggestions
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 slide-in ${
      isExpanded ? 'w-96 h-[600px]' : 'w-80 h-96'
    }`}>
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
          </div>
          
          {/* Input Area */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your data, reports, or get suggestions..."
                className="flex-1 text-sm"
              />
              <Button type="submit" size="sm" disabled={!message.trim()}>
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