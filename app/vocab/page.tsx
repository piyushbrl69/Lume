import {Metadata} from "next";
import VocabClient from "./VocabClient";
export const metadata : Metadata ={
    title: "Vocabulary",
}
export default function Home(){
    return <VocabClient/>;
}