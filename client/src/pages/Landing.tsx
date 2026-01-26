import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { MessageSquare, FileText, BarChart3, Users, ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl" data-testid="text-hero-title">
                Turn Your Vision Into
                <span className="text-primary"> Investor-Ready </span>
                Pitches
              </h1>
              <p className="mt-6 text-lg text-muted-foreground" data-testid="text-hero-description">
                FundMatch uses AI to guide founders through a conversational interview, 
                automatically generating professional one-pagers and connecting you with investors.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-browse-projects">
                  <a href="/marketplace">Browse Projects</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold" data-testid="text-how-it-works">How It Works</h2>
              <p className="mt-2 text-muted-foreground">From idea to investment in four simple steps</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover-elevate" data-testid="card-step-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">1. AI Interview</CardTitle>
                  <CardDescription>
                    Our AI guides you through a conversational interview to understand your business deeply
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="hover-elevate" data-testid="card-step-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">2. One-Pager Generated</CardTitle>
                  <CardDescription>
                    Get a professionally formatted one-pager ready to share with investors
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="hover-elevate" data-testid="card-step-3">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">3. Health Score</CardTitle>
                  <CardDescription>
                    See how your pitch scores across 5 key dimensions with actionable suggestions
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="hover-elevate" data-testid="card-step-4">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">4. Connect</CardTitle>
                  <CardDescription>
                    Publish to the marketplace and connect with interested investors
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered
                </div>
                <h2 className="text-3xl font-bold mb-4" data-testid="text-feature-title">
                  Skip the Forms, Start a Conversation
                </h2>
                <p className="text-muted-foreground mb-6">
                  Traditional pitch decks require hours of writing. FundMatch's AI interviewer 
                  extracts the key information through natural conversation, then formats it 
                  into a compelling one-pager that investors actually want to read.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Jobs-to-be-Done framework for clarity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Supports both equity and debt fundraising
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    5-dimension health score with improvement suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Investor Q&A and interest tracking
                  </li>
                </ul>
              </div>
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg rounded-tl-none p-3 text-sm">
                      Tell me about the problem you're solving and how your solution addresses it.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3 text-sm">
                      Small businesses waste hours on manual invoicing. Our AI automatically 
                      generates and sends invoices from email conversations...
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg rounded-tl-none p-3 text-sm">
                      That's a clear pain point! Who specifically are you targeting - freelancers, 
                      agencies, or a particular industry?
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Fund Your Vision?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join founders who've simplified their fundraising journey with AI-powered pitch creation.
            </p>
            <Button size="lg" variant="secondary" asChild data-testid="button-cta">
              <a href="/api/login">
                Start Your Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>FundMatch - AI-Powered Fundraising Platform</p>
        </div>
      </footer>
    </div>
  );
}
