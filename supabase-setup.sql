-- Run this SQL in your Supabase SQL Editor to set up the vector store for agent memory

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store agent memories
create table if not exists agent_memories (
  id bigserial primary key,
  content text not null, -- The actual text content of the memory/file
  metadata jsonb, -- Additional metadata (e.g., file path, timestamp, role)
  embedding vector(1536) -- The vector embedding (size depends on the model, 1536 is for OpenAI text-embedding-3-small)
);

-- Create a function to search for similar memories
create or replace function match_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    agent_memories.id,
    agent_memories.content,
    agent_memories.metadata,
    1 - (agent_memories.embedding <=> query_embedding) as similarity
  from agent_memories
  where 1 - (agent_memories.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- Create an index for faster similarity search (optional but recommended for large datasets)
create index on agent_memories using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
