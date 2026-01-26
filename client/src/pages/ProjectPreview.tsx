import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, Send, Loader2, RefreshCw, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";
import ReactMarkdown from "react-markdown";

interface HealthScores {
  problem: number;
  solution: number;
  customer: number;
  founder: number;
  market: number;
  suggestions: string[];
}

export default function ProjectPreview() {
  const [, params] = useRoute("/projects/:id/preview");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const projectId = Number(params?.id);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const regenerateOnePager = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/one-pager`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Success",
        description: "One-pager regenerated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate one-pager",
        variant: "destructive",
      });
    },
  });

  const analyzeHealth = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/health-score`);
      return res.json() as Promise<HealthScores>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Analysis Complete",
        description: "Health scores updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze project",
        variant: "destructive",
      });
    },
  });

  const publishProject = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Published!",
        description: "Your project is now live on the marketplace",
      });
      setLocation(`/projects/${projectId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish project",
        variant: "destructive",
      });
    },
  });

  const hasScores = project?.scoreProblem != null;
  const scores: HealthScores | null = hasScores
    ? {
        problem: project!.scoreProblem!,
        solution: project!.scoreSolution!,
        customer: project!.scoreCustomer!,
        founder: project!.scoreFounder!,
        market: project!.scoreMarket!,
        suggestions: [],
      }
    : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-project-name">{project.name}</h1>
            <Badge variant="secondary" className="mt-1">{project.status}</Badge>
          </div>
          <div className="flex gap-2">
            {project.status === "draft" && (
              <Button
                onClick={() => publishProject.mutate()}
                disabled={publishProject.isPending}
                data-testid="button-publish"
              >
                {publishProject.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Publish to Marketplace
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="one-pager" className="space-y-4">
          <TabsList>
            <TabsTrigger value="one-pager" data-testid="tab-one-pager">
              <FileText className="mr-2 h-4 w-4" />
              One-Pager
            </TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-health">
              <BarChart3 className="mr-2 h-4 w-4" />
              Health Score
            </TabsTrigger>
          </TabsList>

          <TabsContent value="one-pager">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Generated One-Pager</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateOnePager.mutate()}
                  disabled={regenerateOnePager.isPending}
                  data-testid="button-regenerate"
                >
                  {regenerateOnePager.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              </CardHeader>
              <CardContent>
                {project.onePagerContent ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="content-one-pager">
                    <ReactMarkdown>{project.onePagerContent}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No one-pager generated yet. Complete the interview first.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle>Health Scores</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyzeHealth.mutate()}
                    disabled={analyzeHealth.isPending}
                    data-testid="button-analyze"
                  >
                    {analyzeHealth.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BarChart3 className="mr-2 h-4 w-4" />
                    )}
                    {hasScores ? "Re-analyze" : "Analyze"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {scores ? (
                    <div className="space-y-4">
                      {[
                        { label: "Problem", value: scores.problem },
                        { label: "Solution", value: scores.solution },
                        { label: "Customer", value: scores.customer },
                        { label: "Founder", value: scores.founder },
                        { label: "Market", value: scores.market },
                      ].map(({ label, value }) => (
                        <div key={label} data-testid={`score-${label.toLowerCase()}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-sm text-muted-foreground">{value}/100</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getScoreColor(value)} transition-all`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Click "Analyze" to get AI-powered health scores for your pitch.
                    </p>
                  )}
                </CardContent>
              </Card>

              {analyzeHealth.data?.suggestions && analyzeHealth.data.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Improvement Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analyzeHealth.data.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2" data-testid={`suggestion-${i}`}>
                          <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
