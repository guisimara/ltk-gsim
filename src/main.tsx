import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:32,color:'white',background:'#111',minHeight:'100vh',fontFamily:'monospace'}}>
          <h2 style={{color:'#ff4444'}}>Runtime Error</h2>
          <pre style={{whiteSpace:'pre-wrap',fontSize:12}}>{String(this.state.error)}</pre>
          <pre style={{whiteSpace:'pre-wrap',fontSize:11,color:'#aaa'}}>{(this.state.error as any)?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary><App /></ErrorBoundary>
);
