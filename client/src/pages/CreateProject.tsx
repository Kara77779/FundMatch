import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@/hooks/use-projects";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, DollarSign, Image as ImageIcon } from "lucide-react";
import { useLocation } from "wouter";

// Extend the schema for form validation
const projectFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  goalAmount: z.coerce.number().min(100, "Goal must be at least $100"),
  imageUrl: z.string().url("Please enter a valid image URL"),
});

export default function CreateProject() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { mutate: createProject, isPending } = useCreateProject();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      goalAmount: 1000,
      imageUrl: "",
    },
  });

  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    // Transform dollars to cents for the API
    createProject(
      { ...data, goalAmount: data.goalAmount * 100 },
      {
        onSuccess: () => {
          setLocation("/");
        },
      }
    );
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in (handled by protected route logic usually, but safe fallback)
  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Start Your Campaign
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Bring your creative project to life. Fill in the details below to get started.
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Project Details</CardTitle>
            <CardDescription>
              Tell potential backers about your project.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. The Next Generation Coffee Grinder" {...field} className="h-12" />
                      </FormControl>
                      <FormDescription>
                        A clear, concise title for your campaign.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Film">Film</SelectItem>
                            <SelectItem value="Games">Games</SelectItem>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Publishing">Publishing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Goal ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground">
                              <DollarSign className="h-5 w-5" />
                            </span>
                            <Input type="number" {...field} className="h-12 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </span>
                          {/* Note for users: For MVP we use Unsplash URL. Real app would have file upload. */}
                          <Input placeholder="https://images.unsplash.com/..." {...field} className="h-12 pl-10" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Paste an Unsplash image URL for your project cover.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Story</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell people about your project, risks, and challenges..." 
                          className="min-h-[200px] resize-y p-4" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg h-14 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    "Launch Campaign"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
