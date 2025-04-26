import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  X,
  Maximize2,
  Minimize2,
  SendHorizonal,
  Bot,
  UserCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "positive" | "negative";
}

interface AIChatboxProps {
  className?: string;
}

const AIChatbox: React.FC<AIChatboxProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello, I'm your PuntaIQ assistant. How can I help you with sports predictions today?",
      timestamp: new Date(),
    },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);
  
  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        // For now we're using fake responses, but this would connect to your AI service
        // const res = await apiRequest("POST", "/api/chat", { message: content });
        // return await res.json();
        
        // Simulate API response with some predefined answers
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const responses: Record<string, string> = {
          "help": "I can help you with sports predictions, subscription information, understanding your stats, or finding specific predictions. What would you like to know?",
          "subscription": "PuntaIQ offers three subscription tiers: Basic (1 sport, daily predictions), Pro (all sports, accumulator tips), and Elite (full access to all predictions and historical data). You can upgrade from your profile page.",
          "predictions": "PuntaIQ provides AI-powered predictions for football, basketball, tennis, baseball, hockey and more. Our predictions include match outcomes, over/under, BTTS, and specialized market insights.",
          "accuracy": "Our AI model has achieved an average success rate of 68.4% across all sports. Football predictions have the highest accuracy at 72.1%, followed by basketball at 64.8%.",
          "accumulator": "PuntaIQ generates special accumulator bets with odds of 15, 20, 30, and 50. These are automatically selected based on our highest confidence predictions.",
          "refund": "For refund requests, please contact our support team at support@puntaiq.com with your account details and subscription information.",
          "odds": "We provide decimal odds format by default. You can change this to fractional or American odds in your profile settings.",
          "contact": "For additional support, please email support@puntaiq.com. Our team responds to all inquiries within 24 hours.",
          "default": "I'll need to check with our specialists about this. Would you like me to forward your question to our support team at support@puntaiq.com?",
        };
        
        const lowercaseContent = content.toLowerCase();
        
        let responseText = responses.default;
        
        // Check for keyword matches
        for (const [keyword, response] of Object.entries(responses)) {
          if (lowercaseContent.includes(keyword) && keyword !== "default") {
            responseText = response;
            break;
          }
        }
        
        return { 
          response: responseText,
          success: true
        };
      } catch (error) {
        console.error("Chat error:", error);
        throw new Error("Failed to get response from assistant");
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        setMessages(prev => [
          ...prev, 
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          }
        ]);
      } else {
        toast({
          title: "Chat Error",
          description: "Failed to get response from assistant",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
      
      setMessages(prev => [
        ...prev, 
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again later or contact support@puntaiq.com for assistance.",
          timestamp: new Date(),
        }
      ]);
    }
  });
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message to the chat
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input field
    setMessage("");
    
    // Send to AI for response
    chatMutation.mutate(message.trim());
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const toggleFeedback = (messageId: string, feedbackType: "positive" | "negative") => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: msg.feedback === feedbackType ? undefined : feedbackType } 
          : msg
      )
    );
    
    toast({
      title: "Thank you for your feedback",
      description: "Your feedback helps us improve our assistant",
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!isOpen) {
    return (
      <Button 
        className={cn("rounded-full p-3 h-14 w-14 fixed bottom-6 right-6 shadow-lg", className)}
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }
  
  return (
    <Card className={cn(
      "fixed transition-all duration-200 shadow-lg z-50",
      isMinimized 
        ? "bottom-6 right-6 w-80 h-16" 
        : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh]",
      className
    )}>
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-medium">PuntaIQ Assistant</CardTitle>
            {!isMinimized && <CardDescription className="text-xs">Ask me anything about predictions</CardDescription>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
          <CardContent className="p-0 flex-grow">
            <ScrollArea className="h-[calc(600px-60px-64px)] max-h-[calc(80vh-60px-64px)]">
              <div className="p-4 space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex w-full gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}>
                      <div className="text-sm">{msg.content}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] opacity-70">{formatTime(msg.timestamp)}</span>
                        
                        {msg.role === "assistant" && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 hover:bg-transparent"
                              onClick={() => toggleFeedback(msg.id, "positive")}
                            >
                              <ThumbsUp className={cn(
                                "h-3 w-3",
                                msg.feedback === "positive" ? "text-green-500 fill-green-500" : "opacity-50"
                              )} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 hover:bg-transparent"
                              onClick={() => toggleFeedback(msg.id, "negative")}
                            >
                              <ThumbsDown className={cn(
                                "h-3 w-3", 
                                msg.feedback === "negative" ? "text-red-500 fill-red-500" : "opacity-50"
                              )} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {msg.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1">
                        {user ? (
                          <AvatarFallback className="bg-muted">
                            {user.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-muted">
                            <UserCircle className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={chatMutation.isPending}
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={!message.trim() || chatMutation.isPending}
              >
                {chatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default AIChatbox;