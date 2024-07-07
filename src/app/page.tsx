import ChatClient from "@/components/ChatClient";
import AudioChat from "./audio-chat/page";

export default function Home() {
  return (
    <AudioChat />
  )
  return (
    <div className=" bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">AI Chat App</h1>
      <ChatClient />
    </div>
  );
}