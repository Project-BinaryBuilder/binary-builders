import { Layout } from "@/components/Layout";
import { Mail } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h2 className="text-2xl font-bold text-primary">{title}</h2>
    <div className="text-foreground/85 leading-relaxed">{children}</div>
  </div>
);

const About = () => (
  <Layout>
    <div className="container max-w-3xl py-16 space-y-10">
      <header className="text-center space-y-3">
        <div className="inline-block px-4 py-2 rounded-full bg-secondary/40 text-secondary-foreground text-xs font-bold uppercase tracking-wider">
          The Creator's Roadmap
        </div>
        <h1 className="text-5xl md:text-6xl font-bold">PROJECT BINARY</h1>
        <p className="text-xl italic text-muted-foreground">
          Motto: <span className="font-semibold">Don't just use the future. Build it.</span>
        </p>
      </header>

      <Section title="What This Curriculum Is">
        Project Binary is a vertically aligned, skill-based Computer Studies curriculum for Grades 4 through 7. It prioritizes applied learning over rote memorization.
      </Section>

      <Section title="Mission">
        Transform students from passive technology users into active technology architects.
      </Section>

      <Section title="Learning Outcomes">
        <p className="mb-2">Students progress from basic hardware interaction to the following:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Writing functional Python programs</li>
          <li>Managing data using professional spreadsheet logic</li>
          <li>Understanding AI ethics and cybersecurity fundamentals</li>
        </ul>
      </Section>

      <Section title="Structure">
        <p>Each chapter follows a theory-to-action model with</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>"Try It" practical modules</li>
          <li>"Think About It" critical-thinking challenges</li>
        </ul>
      </Section>

      <Section title="Why the Name 'Project Binary'">
        <ul className="list-disc pl-6 space-y-1">
          <li>The project signifies hands-on learning.</li>
          <li>Binary represents mastery of foundational computing logic.</li>
        </ul>
      </Section>

      <Section title="Why This Curriculum Exists">
        <ul className="list-disc pl-6 space-y-1">
          <li>Addresses the failure of rote, outdated curricula.</li>
          <li>Focuses on real-world, future-proof skills.</li>
        </ul>
      </Section>

      <Section title="How It Differs from Standard Books">
        <ul className="list-disc pl-6 space-y-1">
          <li>Logic-first, not software-interface-first.</li>
          <li>Heavy emphasis on Python and data management.</li>
          <li>Outcomes and working solutions valued over exam scores.</li>
        </ul>
      </Section>

      <Section title="Guidance">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Students:</strong> Errors are clues, not failures.</li>
          <li><strong>Teachers:</strong> Act as facilitators, not lecturers.</li>
          <li><strong>Parents:</strong> Encourage creative screen time.</li>
        </ul>
      </Section>

      <div className="rounded-3xl bg-gradient-sky text-white p-8 shadow-playful">
        <h2 className="text-2xl font-bold mb-3">Author</h2>
        <p className="text-lg font-semibold">Sabin Adhikari</p>
        <p className="opacity-90">Lead Curriculum Designer & Author</p>
        <a href="mailto:binsone001@gmail.com" className="inline-flex items-center gap-2 mt-3 underline">
          <Mail className="h-4 w-4" /> binsone001@gmail.com
        </a>
      </div>
    </div>
  </Layout>
);

export default About;
