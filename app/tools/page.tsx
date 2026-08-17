import {Metadata} from "next";
import ToolsClient from "./ToolsClient";
export const metadata : Metadata ={
    title: "Tools",
}
export default function Home(){
    return <ToolsClient/>;
}