
  import { createRoot } from "react-dom/client";
  import DynamicApp from "./app/DynamicApp.tsx";
  // 備用：import App from "./app/App.tsx"; // 傳統模式
  import "./styles/index.css";

  // 使用新的動態應用 - 自動讀取 Google Sheets
  createRoot(document.getElementById("root")!).render(<DynamicApp />);
  