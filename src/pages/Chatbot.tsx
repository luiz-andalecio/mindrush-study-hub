import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const initialMessages: Message[] = [
  { id: '1', role: 'assistant', content: 'Olá! 👋 Sou o assistente educacional do MindRush. Como posso te ajudar com seus estudos para o ENEM hoje?' },
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Boa pergunta! Para o ENEM, é importante entender os conceitos fundamentais e praticar com questões anteriores. Posso te ajudar com algum tema específico?',
      }]);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-7rem)] animate-slide-up">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold">Chatbot Educacional</h1>
        <p className="text-muted-foreground text-sm mt-1">Tire suas dúvidas com IA</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto rounded-2xl gradient-card border border-border/50 shadow-card p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              msg.role === 'assistant' ? 'gradient-primary' : 'gradient-accent',
            )}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-primary-foreground" /> : <User className="w-4 h-4 text-primary-foreground" />}
            </div>
            <div className={cn(
              'max-w-[75%] rounded-2xl p-3 text-sm',
              msg.role === 'assistant' ? 'bg-muted/50 rounded-tl-none' : 'gradient-primary text-primary-foreground rounded-tr-none',
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Faça uma pergunta sobre o ENEM..."
          className="bg-muted/50 border-border/50"
        />
        <Button onClick={handleSend} className="gradient-primary text-primary-foreground" size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
