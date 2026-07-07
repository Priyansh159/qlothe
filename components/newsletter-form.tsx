"use client";

import { useState } from "react";
import { useStore } from "@/components/store-provider";

export function NewsletterForm() {
  const { notify } = useStore();
  const [email, setEmail] = useState("");

  return (
    <form
      className="flex max-w-[340px] items-center gap-3 border-b-[1.5px] border-white/40 pb-2.5 focus-within:border-white"
      onSubmit={(e) => {
        e.preventDefault();
        setEmail("");
        notify("You're on the list — welcome to the press");
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.in"
        className="h-8 min-w-0 flex-1 border-none bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
      />
      <button type="submit" aria-label="Subscribe" className="px-0.5 text-[19px] text-white hover:opacity-60">
        →
      </button>
    </form>
  );
}
