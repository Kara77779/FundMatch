import { useProjects } from "@/hooks/use-projects";
import { ProjectCard } from "@/components/ProjectCard";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, HeartHandshake, Rocket, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: projects, isLoading, error } = useProjects();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary py-20 sm:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Fund dreams. <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Build the future.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
              Join thousands of backers supporting innovative projects, creative works, and community causes. Your pledge makes it happen.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/create">
                <Button size="lg" className="w-full sm:w-auto text-base font-semibold px-8 h-12 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                  Start a Campaign
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-semibold px-8 h-12 rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm" onClick={() => {
                document.getElementById('projects-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Discover Projects
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Stats Section */}
      <section className="border-b bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Rocket className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display">10,000+ Projects</h3>
              <p className="mt-2 text-muted-foreground text-sm">Launched by creators worldwide</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display">$50M+ Raised</h3>
              <p className="mt-2 text-muted-foreground text-sm">For creative & social causes</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display">2M+ Backers</h3>
              <p className="mt-2 text-muted-foreground text-sm">Supporting ideas they love</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects-grid" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Trending Projects</h2>
              <p className="mt-2 text-muted-foreground">Discover what's popular right now.</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/5">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-muted/30 border border-dashed border-muted">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Loading amazing projects...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
              <p className="text-destructive font-medium">Failed to load projects</p>
            </div>
          ) : projects?.length === 0 ? (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl bg-muted/30 border border-dashed border-muted text-center p-8">
              <Rocket className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">Be the first to launch a campaign and start raising funds for your idea!</p>
              <Link href="/create">
                <Button>Start a Campaign</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {projects?.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="mt-12 flex justify-center sm:hidden">
            <Button variant="outline" className="w-full">View all projects</Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to bring your idea to life?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90">
            Join the community of creators who are turning their passions into reality. It takes less than 5 minutes to get started.
          </p>
          <Link href="/create">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold shadow-xl shadow-black/10">
              Start Your Project
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 FundMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
