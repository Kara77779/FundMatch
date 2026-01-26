import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Saved() {
  const [, setLocation] = useLocation();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/starred"],
  });

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatFundingGoal = (amount: number | null) => {
    if (!amount) return null;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" data-testid="text-saved-title">
            <Star className="inline-block h-8 w-8 mr-2 text-yellow-500 fill-yellow-500" />
            Saved Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Projects you've bookmarked for later
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No saved projects</h3>
              <p className="text-muted-foreground">
                Browse the marketplace and star projects you're interested in.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => {
              const avgScore = getAverageScore(project);
              const fundingGoal = formatFundingGoal(project.fundingGoal);
              
              return (
                <Card
                  key={project.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/projects/${project.id}`)}
                  data-testid={`card-saved-${project.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      {avgScore !== null && (
                        <Badge variant="outline" className={getScoreColor(avgScore)}>
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {avgScore}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.solution || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.fundingTypeAccepted?.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type === "equity" ? (
                            <><TrendingUp className="h-3 w-3 mr-1" /> Equity</>
                          ) : (
                            <><DollarSign className="h-3 w-3 mr-1" /> Debt</>
                          )}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {fundingGoal && (
                        <span className="font-medium text-foreground">
                          Seeking {fundingGoal}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {project.viewCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
