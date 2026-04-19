import React from "react";
import { useAppStore } from "../store";

export function Preview() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Live Preview</span>
      </div>
      <div className="flex-1 w-full bg-white relative">
        <iframe 
          className="w-full h-full border-none"
          title="preview"
          srcdoc={`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Preview</title>
                <style>
                  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #374151; }
                  .container { text-align: center; }
                  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
                  p { color: #6b7280; max-width: 300px; margin: 0 auto; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Preview Pane</h1>
                  <p>In a real implementation, this would compile and render your React code.</p>
                </div>
              </body>
            </html>
          `}
        />
      </div>
    </div>
  );
}
