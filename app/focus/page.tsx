import type { Metadata } from "next";
import FocusClient from "./FocusClient";

export const metadata: Metadata = {
  title: "Focus",
};


export default function Home() {
  return <FocusClient />;
}