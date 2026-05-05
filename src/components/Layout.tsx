import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-gradient-soft">
    <Navbar />
    <main className="flex-1">{children}</main>
    <footer className="border-t border-border/60 py-8 mt-12">
      <div className="container text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Project Binary · Don't just use the future. Build it.
      </div>
    </footer>
  </div>
);
