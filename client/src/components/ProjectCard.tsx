import { Link } from "wouter";
import { Project } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const percentFunded = Math.min(100, Math.round((project.currentAmount / project.goalAmount) * 100));
  const daysLeft = 14; // Mock data for now since createdAt is static in schema example

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group h-full cursor-pointer">
        <Card className="h-full overflow-hidden border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-background/95 text-foreground backdrop-blur-sm shadow-sm">
                {project.category}
              </Badge>
            </div>
          </div>
          
          <CardHeader className="p-5 pb-2">
            <h3 className="line-clamp-1 text-lg font-bold font-display text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground mt-1 min-h-[40px]">
              {project.description}
            </p>
          </CardHeader>
          
          <CardContent className="p-5 pt-2 pb-4">
            <div className="mt-4 space-y-2">
              <div className="flex items-end justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-primary text-base">
                    ${(project.currentAmount / 100).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    raised of ${(project.goalAmount / 100).toLocaleString()}
                  </span>
                </div>
                <span className="font-bold text-foreground">{percentFunded}%</span>
              </div>
              <Progress value={percentFunded} className="h-2 bg-muted" />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t p-5 py-3 text-xs text-muted-foreground bg-muted/20">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{Math.floor(Math.random() * 50) + 5} backers</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{daysLeft} days left</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
