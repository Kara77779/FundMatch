import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationData {
  messages: Message[];
  currentStage: string;
}

const STAGE_LABELS: Record<string, string> = {
  solution: "Problem & Solution",
  customer: "Target Customer",
  goals: "Goals & Success",
  context: "Market Context",
  barriers: "Barriers & Moat",
  unfair_advantages: "Unfair Advantages",
  credentials: "Team & Credentials",
  funding: "Funding Details",
  complete: "Complete",
};

export default function ProjectChat() {
  const [, params] = useRoute("/projects/:id/chat");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const projectId = Number(params?.id);
  
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: conversation, isLoading: isLoadingConversation } = useQuery<ConversationData>({
    queryKey: ["/api/projects", projectId, "conversation"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/conversation`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load conversation");
      return res.json();
    },
    enabled: !!projectId,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/conversation`, { message });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "conversation"] });
      if (data.complete) {
        toast({
          title: "Interview Complete!",
          description: "You can now generate your one-pager.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const generateOnePager = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/one-pager`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setLocation(`/projects/${projectId}/preview`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate one-pager",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isComplete = conversation?.currentStage === "complete";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="container flex-1 py-4 flex flex-col max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" data-testid="text-project-name">
              {project?.name || "Loading..."}
            </h1>
            <Badge variant="outline" className="mt-1" data-testid="badge-stage">
              {STAGE_LABELS[conversation?.currentStage || "solution"] || "Interview"}
            </Badge>
          </div>
          {isComplete && (
            <Button
              onClick={() => generateOnePager.mutate()}
              disabled={generateOnePager.isPending}
              data-testid="button-generate"
            >
              {generateOnePager.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate One-Pager
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingConversation ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {conversation?.messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                    data-testid={`message-${i}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "assistant"
                          ? "bg-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Sparkles className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-xs font-medium">You</span>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.role === "assistant"
                          ? "bg-muted rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg rounded-tl-none p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {!isComplete && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="min-h-[60px] resize-none"
                  disabled={sendMessage.isPending}
                  data-testid="input-message"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
