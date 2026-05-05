import { Link } from "react-router-dom";
import { Sparkles, Code2, Brain, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";

const features = [
  { icon: Code2, color: "bg-primary/10 text-primary", title: "Hands-on Python", desc: "Write real, working programs from Grade 4 onwards." },
  { icon: Brain, color: "bg-fun/10 text-fun", title: "Think, Don't Memorize", desc: "Critical-thinking challenges built into every chapter." },
  { icon: Rocket, color: "bg-accent/10 text-accent", title: "Future-Proof Skills", desc: "AI ethics, cybersecurity, data — taught the modern way." },
];

const Index = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-hero opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-sky opacity-20 blur-3xl" />

      <div className="container relative py-16 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-pop-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/40 text-secondary-foreground text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Grades 4 – 7 · Computer Studies
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[0.95]">
            Don't just use<br />the future.{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">Build it.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
            Project Binary turns students from passive technology users into active technology architects — through Python, data, and a creator's mindset.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="rounded-full text-base h-12 px-7 shadow-playful">
              <Link to="/login">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-full text-base h-12 px-7">
              <Link to="/about">Read the Roadmap</Link>
            </Button>
          </div>
        </div>

        <div className="relative h-[420px] hidden md:block">
          <div className="absolute top-8 left-4 w-56 p-5 rounded-3xl bg-card shadow-playful animate-float">
            <div className="text-xs font-bold text-primary mb-1">CHAPTER 3</div>
            <div className="font-bold mb-2">Loops in Python</div>
            <pre className="text-xs bg-muted rounded-xl p-3 font-mono">{`for i in range(5):\n  print("Hi!")`}</pre>
          </div>
          <div className="absolute top-32 right-0 w-48 p-5 rounded-3xl bg-gradient-sky text-white shadow-playful animate-float" style={{ animationDelay: "1s" }}>
            <Brain className="h-7 w-7 mb-2" />
            <div className="font-bold">Think About It</div>
            <div className="text-xs opacity-90 mt-1">What if AI could grade itself?</div>
          </div>
          <div className="absolute bottom-4 left-12 w-52 p-5 rounded-3xl bg-secondary text-secondary-foreground shadow-playful animate-float" style={{ animationDelay: "2s" }}>
            <div className="text-3xl font-bold">25/25</div>
            <div className="text-xs font-semibold">Try It · Score Unlocked</div>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="container py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">A curriculum that actually builds builders.</h2>
        <p className="text-muted-foreground text-lg">Logic-first. Outcome-driven. Built for the next generation.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="p-7 rounded-3xl bg-card shadow-soft border border-border/50 hover:shadow-playful hover:-translate-y-1 transition-all">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
              <f.icon className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
            <p className="text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="container pb-20">
      <div className="rounded-[2rem] bg-gradient-hero p-10 md:p-16 text-center text-primary-foreground shadow-playful relative overflow-hidden">
        <div className="absolute top-4 right-8 text-6xl animate-wiggle">✨</div>
        <div className="absolute bottom-4 left-8 text-6xl animate-float">🚀</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 relative">Ready to start building?</h2>
        <p className="text-lg opacity-95 mb-6 relative">Log in to access your class materials, exams, and dashboards.</p>
        <Button asChild size="lg" variant="secondary" className="rounded-full h-12 px-8 text-base relative">
          <Link to="/login">Open Your Dashboard</Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Index;
