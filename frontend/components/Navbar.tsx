"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="text-xl font-bold text-primary">
          ChemAI Lab
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/converter" className="text-sm font-medium hover:text-primary">
            SMILES Converter
          </Link>
          <Link href="/electrolysis" className="text-sm font-medium hover:text-primary">
            Electrolysis
          </Link>
          <Link href="/periodic" className="text-sm font-medium hover:text-primary">
            Periodic Table
          </Link>
          <Link href="/retrosynthesis" className="text-sm font-medium hover:text-primary">
            Retrosynthesis
          </Link>
          <Link href="/safety" className="text-sm font-medium hover:text-primary">
            Safety Checker
          </Link>
          <Link href="/chat" className="text-sm font-medium hover:text-primary">
            AI Assistant
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">Sign In</Button>
        </div>
      </div>
    </header>
  );
}