import { useRoute } from "wouter";
import { useProject, usePledgeProject } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Share2, ShieldCheck, Flag, Calendar, Heart } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const pledgeSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least $1"),
});

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const id = parseInt(params?.id || "0");
  const { data: project, isLoading, error } = useProject(id);
  const { mutate: pledge, isPending: isPledging } = usePledgeProject();
  const { user } = useAuth();
  const [pledgeDialogOpen, setPledgeDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof pledgeSchema>>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      amount: 10,
    },
  });

  const onSubmit = (data: z.infer<typeof pledgeSchema>) => {
    pledge(
      { projectId: id, amount: Math.round(data.amount * 100) }, // Convert dollars to cents
      {
        onSuccess: () => {
          setPledgeDialogOpen(false);
          form.reset();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive">Project not found</h2>
          <p className="mt-2 text-muted-foreground">The project you are looking for does not exist or has been removed.</p>
          <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const percentFunded = Math.round((project.currentAmount / project.goalAmount) * 100);

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
              {project.category}
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {project.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            {project.description}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left Column: Media */}
          <div className="lg:col-span-2 space-y-8">
            <div className="overflow-hidden rounded-2xl bg-muted shadow-lg aspect-video relative">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>
            
            <Tabs defaultValue="story" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="story" 
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-muted-foreground"
                >
                  Story
                </TabsTrigger>
                <TabsTrigger 
                  value="updates" 
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-muted-foreground"
                >
                  Updates
                </TabsTrigger>
                <TabsTrigger 
                  value="comments" 
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-muted-foreground"
                >
                  Comments
                </TabsTrigger>
              </TabsList>
              <TabsContent value="story" className="pt-8">
                <div className="prose max-w-none text-muted-foreground">
                  <h3 className="text-foreground text-2xl font-display font-bold mb-4">About this project</h3>
                  <p className="whitespace-pre-line leading-relaxed">
                    {project.description}
                  </p>
                  <p className="mt-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="updates" className="pt-8 text-center text-muted-foreground">
                No updates yet. Check back later!
              </TabsContent>
              <TabsContent value="comments" className="pt-8 text-center text-muted-foreground">
                Comments are closed for now.
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Funding Info */}
          <div className="space-y-8">
            <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-6 space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/10">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(percentFunded, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm font-medium pt-2">
                  <span className="text-primary font-bold">{percentFunded}% Funded</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-3xl font-bold font-display text-foreground">
                    ${(project.currentAmount / 100).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    pledged of ${(project.goalAmount / 100).toLocaleString()} goal
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold font-display text-foreground">124</p>
                    <p className="text-sm text-muted-foreground">backers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display text-foreground">14</p>
                    <p className="text-sm text-muted-foreground">days to go</p>
                  </div>
                </div>

                <Dialog open={pledgeDialogOpen} onOpenChange={setPledgeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30"
                      disabled={!user}
                    >
                      {user ? "Back this project" : "Log in to back"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Back this project</DialogTitle>
                      <DialogDescription>
                        Enter the amount you would like to contribute.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pledge Amount ($)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                  <Input type="number" min="1" step="1" className="pl-7" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" className="w-full" disabled={isPledging}>
                            {isPledging ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Make Pledge"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Heart className="mr-2 h-4 w-4" /> Remind me
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  All or nothing. This project will only be funded if it reaches its goal by {new Date().toLocaleDateString()}.
                </p>
              </div>
            </div>

            {/* Creator Info */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-4">About the Creator</h4>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="bg-primary/10 text-primary">C</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">Creator Name</p>
                  <p className="text-xs text-muted-foreground">New York, NY</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A passionate creator building things for the community.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> Identity Verified
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Joined Sep 2023
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
