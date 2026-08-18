import type { Metadata } from "next";
import HelpClient from "./HelpClient";

export const metadata: Metadata = {
  title: "Help",
};


export default function Home() {
  return <HelpClient />;
}