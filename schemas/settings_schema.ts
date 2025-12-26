
export const settingsSchema = `
DEFINE TABLE settings SCHEMAFULL;

-- UI Preferences
DEFINE FIELD theme ON TABLE settings TYPE string DEFAULT 'dark';
DEFINE FIELD zoomLevel ON TABLE settings TYPE float DEFAULT 1.0;
DEFINE FIELD defaultNodeArchtype ON TABLE settings TYPE string;

-- LLM Provider Credentials
DEFINE FIELD llm ON TABLE settings TYPE object;
DEFINE FIELD llm.anthropic_key ON TABLE settings TYPE string; -- Claude
DEFINE FIELD llm.gemini_key ON TABLE settings TYPE string;    -- Google Gemini
DEFINE FIELD llm.openai_key ON TABLE settings TYPE string;    -- OpenAI
DEFINE FIELD llm.voyage_key ON TABLE settings TYPE string;    -- Voyage AI (for Anthropic embeddings)

-- Embedding Provider Toggles (which providers to use for embedding)
DEFINE FIELD llm.embed_gemini ON TABLE settings TYPE bool DEFAULT true;
DEFINE FIELD llm.embed_openai ON TABLE settings TYPE bool DEFAULT true;
DEFINE FIELD llm.embed_anthropic ON TABLE settings TYPE bool DEFAULT true;

-- Media Storage Configuration (Backblaze B2)
DEFINE FIELD storage ON TABLE settings TYPE object;
DEFINE FIELD storage.backblaze ON TABLE settings TYPE object;
DEFINE FIELD storage.backblaze.key_id ON TABLE settings TYPE string;
DEFINE FIELD storage.backblaze.app_key ON TABLE settings TYPE string;
DEFINE FIELD storage.backblaze.bucket_name ON TABLE settings TYPE string;
DEFINE FIELD storage.backblaze.region ON TABLE settings TYPE string;
DEFINE FIELD storage.backblaze.endpoint ON TABLE settings TYPE string; -- Optional custom endpoint
`;
