import {Metadata} from "next";
import HistoryClient from "./HisClient";
 export const metadata: Metadata = {
  title: "History",
};
export default function Home() {
  return <HistoryClient />;
}
