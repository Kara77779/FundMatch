import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, DollarSign, MessageSquare, Eye, BarChart3, Send, Loader2, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Project, Question } from "@shared/schema";
import ReactMarkdown from "react-markdown";

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const projectId = Number(params?.id);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  
  const [interestAmount, setInterestAmount] = useState("");
  const [interestMessage, setInterestMessage] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);

  const { data: project, isLoading } = useQuery<any>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/projects", projectId, "questions"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/questions`);
      return res.json();
    },
  });

  const toggleStar = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/star`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: data.starred ? "Saved!" : "Removed",
        description: data.starred ? "Added to your saved projects" : "Removed from saved projects",
      });
    },
  });

  const expressInterest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/interest`, {
        amount: parseInt(interestAmount) || null,
        message: interestMessage,
      });
      return res.json();
    },
    onSuccess: () => {
      setInterestDialogOpen(false);
      setInterestAmount("");
      setInterestMessage("");
      toast({
        title: "Interest Expressed!",
        description: "The founder will be notified of your interest.",
      });
    },
  });

  const askQuestion = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/questions`, {
        question: questionText,
        isAnonymous: false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "questions"] });
      setQuestionText("");
      toast({
        title: "Question Submitted!",
        description: "The founder will be notified.",
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const avgScore = project ? [
    project.scoreProblem,
    project.scoreSolution,
    project.scoreCustomer,
    project.scoreFounder,
    project.scoreMarket,
  ].filter((s: number | null): s is number => s != null).reduce((a: number, b: number, _, arr) => a + b / arr.length, 0) : null;

  const isOwner = user && project?.founderId === user.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold" data-testid="text-project-name">{project.name}</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {project.viewCount || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {project.starCount || 0} saves
                    </span>
                    {avgScore !== null && avgScore > 0 && (
                      <span className={`flex items-center gap-1 ${getScoreColor(Math.round(avgScore))}`}>
                        <BarChart3 className="h-4 w-4" />
                        {Math.round(avgScore)}/100
                      </span>
                    )}
                  </div>
                </div>
                {isAuthenticated && !isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant={project.isStarred ? "default" : "outline"}
                      size="icon"
                      onClick={() => toggleStar.mutate()}
                      disabled={toggleStar.isPending}
                      data-testid="button-star"
                    >
                      <Star className={`h-4 w-4 ${project.isStarred ? "fill-current" : ""}`} />
                    </Button>
                    <Dialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-express-interest">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Express Interest
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Express Investment Interest</DialogTitle>
                          <DialogDescription>
                            Let the founder know you're interested in investing.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium">Investment Amount (optional)</label>
                            <Input
                              type="number"
                              placeholder="e.g., 50000"
                              value={interestAmount}
                              onChange={(e) => setInterestAmount(e.target.value)}
                              data-testid="input-interest-amount"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Message (optional)</label>
                            <Textarea
                              placeholder="Tell the founder why you're interested..."
                              value={interestMessage}
                              onChange={(e) => setInterestMessage(e.target.value)}
                              data-testid="input-interest-message"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => expressInterest.mutate()}
                            disabled={expressInterest.isPending}
                            data-testid="button-submit-interest"
                          >
                            {expressInterest.isPending ? "Submitting..." : "Submit Interest"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>

              {project.fundingTypeAccepted && (
                <div className="flex gap-2 mb-4">
                  {project.fundingTypeAccepted.map((type: string) => (
                    <Badge key={type} variant="secondary">
                      {type === "equity" ? "Equity Investment" : "Debt Financing"}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Tabs defaultValue="pitch" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pitch">Pitch</TabsTrigger>
                <TabsTrigger value="qna">
                  Q&A ({questions?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pitch">
                <Card>
                  <CardContent className="pt-6">
                    {project.onePagerContent ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="content-pitch">
                        <ReactMarkdown>{project.onePagerContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No pitch content available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qna">
                <div className="space-y-4">
                  {isAuthenticated && !isOwner && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Ask a question about this project..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="min-h-[60px]"
                            data-testid="input-question"
                          />
                          <Button
                            size="icon"
                            onClick={() => askQuestion.mutate()}
                            disabled={!questionText.trim() || askQuestion.isPending}
                            data-testid="button-ask-question"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {questions?.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No questions yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    questions?.map((q) => (
                      <Card key={q.id} data-testid={`question-${q.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {q.isAnonymous ? "Anonymous" : "Investor"}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium mb-2">{q.question}</p>
                          {q.answer ? (
                            <div className="bg-muted rounded-lg p-3 mt-2">
                              <p className="text-sm">{q.answer}</p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">Awaiting response</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Founder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={project.founder?.profileImage} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.founder?.username || "Founder"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.fundingGoal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funding Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Funding Goal</p>
                    <p className="text-2xl font-bold">
                      ${project.fundingGoal.toLocaleString()}
                    </p>
                  </div>
                  
                  {project.fundingTypeAccepted?.includes("equity") && project.valuationMin && (
                    <div>
                      <p className="text-sm text-muted-foreground">Valuation Range</p>
                      <p className="font-medium">
                        ${project.valuationMin.toLocaleString()} - ${project.valuationMax?.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {project.fundingTypeAccepted?.includes("debt") && project.expectedInterestRate && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Interest Rate</p>
                        <p className="font-medium">{project.expectedInterestRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Repayment Period</p>
                        <p className="font-medium">{project.repaymentMonths} months</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {project.scoreProblem != null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Health Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Problem", value: project.scoreProblem },
                    { label: "Solution", value: project.scoreSolution },
                    { label: "Customer", value: project.scoreCustomer },
                    { label: "Founder", value: project.scoreFounder },
                    { label: "Market", value: project.scoreMarket },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{label}</span>
                        <span className={getScoreColor(value)}>{value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            value >= 80 ? "bg-green-500" :
                            value >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
