
import type { Metadata } from "next";
import DiaryClient from "./DiaryClient";

export const metadata: Metadata = {
  title: "Diary",
};


export default function Home() {
  return <DiaryClient />;
}