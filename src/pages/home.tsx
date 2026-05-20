import { Link } from "react-router-dom";
import { ArrowRight, Code, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Zap,
    title: "Bun + React",
    description: "Powered by Bun runtime and React 19 for lightning-fast development.",
  },
  {
    icon: Palette,
    title: "shadcn/ui",
    description: "Beautifully designed components built with Radix UI and Tailwind CSS.",
  },
  {
    icon: Code,
    title: "API Tester",
    description: "Built-in API testing tool to quickly test your endpoints.",
  },
];

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center space-y-4 py-12">
        <Badge variant="secondary" className="mb-4">
          Bun + React + shadcn/ui
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Build Faster with Bun
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">
          A modern full-stack starter template with React Router, shadcn/ui components,
          and lucide icons. Edit and save to test HMR.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button asChild>
            <Link to="/api-tester">
              Try API Tester
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://bun.com" target="_blank" rel="noopener noreferrer">
              Learn Bun
            </a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="h-8 w-8 text-primary mb-2" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground py-8">
        Edit <code className="bg-muted px-1 py-0.5 rounded text-xs">src/pages/home.tsx</code> and
        save to test HMR
      </footer>
    </div>
  );
}
