import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border/50 hover:ring-border">
              Announcing our next round of funding. <a href="#" className="font-semibold text-primary"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            We help bring creative projects to life.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            FundMatch connects creators with the resources they need to make their ideas a reality. We believe in the power of community to drive innovation.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/create">
              <Button size="lg" className="rounded-full px-8">Get started</Button>
            </Link>
            <Link href="/">
               <Button variant="ghost" className="rounded-full">
                 View Projects <span aria-hidden="true">→</span>
               </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
