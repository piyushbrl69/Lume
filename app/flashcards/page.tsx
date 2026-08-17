import type { Metadata } from "next";
import FlahcardClient from "./FlashcardClient";

export const metadata: Metadata = {
  title: "Flashcards",
};

export default function Home() {
  return <FlahcardClient />;
}