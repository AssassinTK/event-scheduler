
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // 使用恢復的原應用 - 包含動態同步功能
  createRoot(document.getElementById("root")!).render(<App />);
  