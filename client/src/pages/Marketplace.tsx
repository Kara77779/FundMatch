import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, TrendingUp, Eye, BarChart3 } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [fundingType, setFundingType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { search, fundingType, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "published");
      if (search) params.set("search", search);
      if (fundingType !== "all") params.set("fundingType", fundingType);
      params.set("sortBy", sortBy);
      const res = await fetch(`/api/projects?${params}`);
      return res.json();
    },
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
          <h1 className="text-3xl font-bold" data-testid="text-marketplace-title">Project Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Discover investment opportunities from early-stage founders
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Select value={fundingType} onValueChange={setFundingType}>
            <SelectTrigger className="w-[180px]" data-testid="select-funding-type">
              <SelectValue placeholder="Funding Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="debt">Debt</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                  <div className="h-4 bg-muted rounded w-2/3 mt-1" />
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
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                {search ? "Try a different search term" : "No published projects yet"}
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
                  data-testid={`card-project-${project.id}`}
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
