import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { FileSystem, AIProvider, MODEL_PROVIDERS } from "../store";

export const SYSTEM_INSTRUCTION = `You are an expert autonomous coder agent.
Your goal is to help the user build, modify, and debug their software project.
You have access to the user's file system through tools.

CRITICAL WORKFLOW RULE:
Before starting any NEW project or executing major structural changes, you MUST explicitly ask the user for their preferred specifications if they haven't provided them. 
Specifically, ask for:
- Preferred Tech Stack (Frontend framework, styling)
- Backend framework (if applicable)
- Database specifications (if applicable)
- Overall project structure

Wait for their response before executing code changes. If they have already provided sufficient details in their prompt, you may proceed immediately.

When building or fixing, you should:
1. Think about the necessary steps.
2. Use the provided tools to create, update, or delete files.
3. If you need to run commands (like npm install), use the run_command tool.
4. Explain what you did concisely.

Always write production-ready, clean, and well-documented code.
If an error occurs, analyze it and use the tools to fix it autonomously.`;

export const toolsDeclarations = [
  {
    name: "create_file",
    description: "Create a new file at the specified path with the given content.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The absolute path of the file to create, starting with /" },
        content: { type: "string", description: "The content of the file" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "update_file",
    description: "Update an existing file at the specified path with the given content. This replaces the entire file content.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The absolute path of the file to update, starting with /" },
        content: { type: "string", description: "The new content of the file" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file at the specified path.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The absolute path of the file to delete, starting with /" },
      },
      required: ["path"],
    },
  },
  {
    name: "run_command",
    description: "Run a shell command in the project directory (e.g., npm install, npm run build).",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to execute" },
      },
      required: ["command"],
    },
  },
  {
    name: "store_memory",
    description: "Store a piece of information or code into the agent's long-term vector memory.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The text content or code to store" },
        metadata: { type: "string", description: "Optional JSON string containing metadata (e.g. file path, context)" },
      },
      required: ["content"],
    },
  },
  {
    name: "search_memory",
    description: "Search the agent's long-term vector memory for relevant information or code based on a semantic query.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The semantic search query" },
        match_count: { type: "number", description: "Number of results to return (default: 5)" },
      },
      required: ["query"],
    },
  }
];

const getGeminiTools = () => {
  return toolsDeclarations.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: Type.OBJECT,
      properties: Object.fromEntries(Object.entries(t.parameters.properties).map(([k, v]) => [k, { type: Type.STRING, description: (v as any).description }])),
      required: t.parameters.required
    }
  }));
};

const getOpenAITools = () => {
  return toolsDeclarations.map(t => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));
};

const getAnthropicTools = () => {
  return toolsDeclarations.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as any
  }));
};

export async function processAgentTurn(
  prompt: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  currentFiles: FileSystem,
  apiKeys: Record<AIProvider, string>,
  model: string,
  onStreamChunk: (text: string) => void,
  onToolCall: (name: string, args: any) => Promise<any>,
) {
  const provider = MODEL_PROVIDERS[model] || 'gemini';
  const apiKey = apiKeys[provider] || (provider === 'gemini' ? process.env.GEMINI_API_KEY : '');
  
  if (!apiKey) {
    throw new Error(`API Key for ${provider} is missing. Please provide it in settings.`);
  }

  const fileSystemContext =
    `Current File System State:\n` +
    Object.keys(currentFiles).map((path) => `- ${path}`).join("\n") +
    `\n\nYou can ask to read a file if you need to see its contents, but you should generally just overwrite or create files as needed based on the user's request.`;

  const fullPrompt = `${fileSystemContext}\n\nUser Request: ${prompt}`;

  if (provider === 'gemini') {
    return runGemini(apiKey, model, fullPrompt, history, onStreamChunk, onToolCall);
  } else if (provider === 'anthropic') {
    return runAnthropic(apiKey, model, fullPrompt, history, onStreamChunk, onToolCall);
  } else {
    return runOpenAI(provider, apiKey, model, fullPrompt, history, onStreamChunk, onToolCall);
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = 
        error?.status === 429 || 
        error?.response?.status === 429 || 
        (error?.message && error.message.includes('429'));
        
      if (isRateLimit && retries < maxRetries) {
        retries++;
        console.warn(`Rate limited (429). Retrying in ${retries * 2}s...`);
        await delay(2000 * Math.pow(2, retries)); // Exponential backoff: 4s, 8s, 16s...
        continue;
      }
      throw error;
    }
  }
}

async function runGemini(apiKey: string, model: string, fullPrompt: string, history: any[], onStreamChunk: any, onToolCall: any) {
  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    ...history.map((h: any) => ({ role: h.role, parts: h.parts })),
    { role: "user", parts: [{ text: fullPrompt }] },
  ];

  let fullText = "";
  
  for (let turn = 0; turn < 15; turn++) {
    const responseStream = await executeWithRetry(() => ai.models.generateContentStream({
      model,
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: getGeminiTools() }],
        temperature: 0.2,
      },
    }));

    let functionCalls: any[] = [];
    let modelParts: any[] = [];

    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      const parts = c.candidates?.[0]?.content?.parts || [];
      modelParts.push(...parts);
      
      const textPart = parts.find(p => p.text);
      if (textPart?.text) {
        fullText += textPart.text;
        onStreamChunk(textPart.text);
      }
      if (c.functionCalls && c.functionCalls.length > 0) {
        functionCalls.push(...c.functionCalls);
      }
    }

    if (functionCalls.length === 0) break;

    const uniqueModelParts = modelParts.filter((part, index, self) => 
      index === self.findIndex((t) => (
        (t.text && t.text === part.text) || 
        (t.functionCall && part.functionCall && t.functionCall.name === part.functionCall.name)
      ))
    );
    contents.push({ role: "model", parts: uniqueModelParts });

    const toolResponses = [];
    for (const call of functionCalls) {
      try {
        const result = await onToolCall(call.name, call.args);
        toolResponses.push({ functionResponse: { name: call.name, response: { result } } });
      } catch (err: any) {
        toolResponses.push({ functionResponse: { name: call.name, response: { error: err.message } } });
      }
    }
    contents.push({ role: "user", parts: toolResponses });
  }

  return fullText;
}

async function runOpenAI(provider: AIProvider, apiKey: string, model: string, fullPrompt: string, history: any[], onStreamChunk: any, onToolCall: any) {
  let baseURL = `${window.location.origin}/api/proxy/openai`;
  if (provider === 'groq') baseURL = `${window.location.origin}/api/proxy/groq`;
  if (provider === 'mistral') baseURL = `${window.location.origin}/api/proxy/mistral`;
  if (provider === 'deepseek') baseURL = `${window.location.origin}/api/proxy/deepseek`;

  const openai = new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true });
  
  const messages: any[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map((h: any) => ({ role: h.role === "model" ? "assistant" : "user", content: h.parts[0].text })),
    { role: "user", content: fullPrompt }
  ];

  let fullText = "";

  for (let turn = 0; turn < 15; turn++) {
    const stream = await executeWithRetry(() => openai.chat.completions.create({
      model,
      messages,
      stream: true,
      tools: getOpenAITools(),
      temperature: 0.2
    }));

    let currentText = "";
    let toolCalls: any[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        currentText += delta.content;
        fullText += delta.content;
        onStreamChunk(delta.content);
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: tc.id, type: 'function', function: { name: tc.function?.name, arguments: '' } };
          }
          if (tc.function?.arguments) {
            toolCalls[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }
    }

    if (toolCalls.length === 0) break;

    messages.push({ role: "assistant", content: currentText || null, tool_calls: toolCalls });
    
    for (const call of toolCalls) {
      try {
        const args = JSON.parse(call.function.arguments);
        const result = await onToolCall(call.function.name, args);
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      } catch (err: any) {
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: err.message }) });
      }
    }
  }

  return fullText;
}

async function runAnthropic(apiKey: string, model: string, fullPrompt: string, history: any[], onStreamChunk: any, onToolCall: any) {
  const anthropic = new Anthropic({ apiKey, baseURL: `${window.location.origin}/api/proxy/anthropic`, dangerouslyAllowBrowser: true });
  
  const messages: any[] = [
    ...history.map((h: any) => ({ role: h.role === "model" ? "assistant" : "user", content: h.parts[0].text })),
    { role: "user", content: fullPrompt }
  ];

  let fullText = "";

  for (let turn = 0; turn < 15; turn++) {
    const stream = await executeWithRetry(() => anthropic.messages.create({
      model,
      messages,
      system: SYSTEM_INSTRUCTION,
      stream: true,
      tools: getAnthropicTools(),
      max_tokens: 4096,
      temperature: 0.2
    }));

    let currentText = "";
    let currentToolCall: any = null;
    let toolCalls: any[] = [];

    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        currentToolCall = { id: event.content_block.id, name: event.content_block.name, input: '' };
      } else if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
        if (currentToolCall) currentToolCall.input += event.delta.partial_json;
      } else if (event.type === 'content_block_stop' && currentToolCall) {
        toolCalls.push(currentToolCall);
        currentToolCall = null;
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        currentText += event.delta.text;
        fullText += event.delta.text;
        onStreamChunk(event.delta.text);
      }
    }

    if (toolCalls.length === 0) break;

    const assistantContent: any[] = [];
    if (currentText) assistantContent.push({ type: "text", text: currentText });
    for (const tc of toolCalls) {
      assistantContent.push({ type: "tool_use", id: tc.id, name: tc.name, input: JSON.parse(tc.input) });
    }
    messages.push({ role: "assistant", content: assistantContent });

    const toolResultContent: any[] = [];
    for (const call of toolCalls) {
      try {
        const args = JSON.parse(call.input);
        const result = await onToolCall(call.name, args);
        toolResultContent.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(result) });
      } catch (err: any) {
        toolResultContent.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify({ error: err.message }), is_error: true });
      }
    }
    messages.push({ role: "user", content: toolResultContent });
  }

  return fullText;
}
