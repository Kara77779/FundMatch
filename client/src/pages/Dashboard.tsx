import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MessageSquare, Eye, FileText, BarChart3, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newProjectName, setNewProjectName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/my-projects"],
  });

  const createProject = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/projects", { name });
      return res.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-projects"] });
      setDialogOpen(false);
      setNewProjectName("");
      setLocation(`/projects/${project.id}/chat`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Published</Badge>;
      case "funded":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Funded</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getAverageScore = (project: Project) => {
    const scores = [
      project.scoreProblem,
      project.scoreSolution,
      project.scoreCustomer,
      project.scoreFounder,
      project.scoreMarket,
    ].filter((s): s is number => s != null);
    
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Your Projects</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your fundraising projects
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-project">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Give your project a name to get started. You'll be guided through an AI interview next.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="e.g., My Startup Idea"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  data-testid="input-project-name"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createProject.mutate(newProjectName)}
                  disabled={!newProjectName.trim() || createProject.isPending}
                  data-testid="button-create-project"
                >
                  {createProject.isPending ? "Creating..." : "Start Interview"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project and let AI help you build a compelling pitch.
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => {
              const avgScore = getAverageScore(project);
              return (
                <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>
                      {project.solution ? project.solution.slice(0, 100) + "..." : "Interview not started"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {avgScore !== null && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>{avgScore}/100</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{project.viewCount || 0} views</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/projects/${project.id}/chat`)}
                      data-testid={`button-chat-${project.id}`}
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Interview
                    </Button>
                    {project.onePagerContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/projects/${project.id}/preview`)}
                        data-testid={`button-preview-${project.id}`}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Preview
                      </Button>
                    )}
                    {project.status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/projects/${project.id}`)}
                        data-testid={`button-view-${project.id}`}
                      >
                        View Live
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
