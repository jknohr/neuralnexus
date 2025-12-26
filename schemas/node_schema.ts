export const nodeSchema = `
-- Node Table Schema
DEFINE TABLE node SCHEMALESS;

-- Core Identity & Type
DEFINE FIELD type           ON TABLE node TYPE string;
DEFINE FIELD title          ON TABLE node TYPE string;
DEFINE FIELD summary        ON TABLE node TYPE string;
DEFINE FIELD content        ON TABLE node TYPE string;

-- Connectivity (Arrays of UUIDs)
DEFINE FIELD parents        ON TABLE node TYPE array<record<node>>;
DEFINE FIELD children       ON TABLE node TYPE array<record<node>>;
DEFINE FIELD subnodes       ON TABLE node TYPE array<record<node>>;

-- Citations & References
DEFINE FIELD citations      ON TABLE node TYPE array<string>; -- ref:uuid references used in content
DEFINE FIELD references     ON TABLE node TYPE array<object>; -- Full reference objects with metadata

-- Template / Flexible Data
DEFINE FIELD data           ON TABLE node TYPE object FLEXIBLE;

-- Visuals & Metrics
DEFINE FIELD color          ON TABLE node TYPE string;
DEFINE FIELD val            ON TABLE node TYPE float DEFAULT 1.0;

-- Spatial / Flow Data
DEFINE FIELD flow_x         ON TABLE node TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'] DEFAULT 'free';
DEFINE FIELD flow_y         ON TABLE node TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'] DEFAULT 'free';
DEFINE FIELD flow_z         ON TABLE node TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'] DEFAULT 'free';

-- AI / Vector Data - Multi-Provider Support
-- OpenAI: text, images, files
DEFINE FIELD embedding_openai ON TABLE node TYPE array<float>;
DEFINE INDEX idx_embedding_openai ON TABLE node COLUMNS embedding_openai 
  MTREE DIMENSION 1536 
  DIST COSINE 
  TYPE F32;

-- Anthropic: text, images, files  
DEFINE FIELD embedding_anthropic ON TABLE node TYPE array<float>;
DEFINE INDEX idx_embedding_anthropic ON TABLE node COLUMNS embedding_anthropic 
  MTREE DIMENSION 768 
  DIST COSINE 
  TYPE F32;

-- Gemini: text, images, files, audio, video (multimodal)
DEFINE FIELD embedding_gemini ON TABLE node TYPE array<float>;
DEFINE INDEX idx_embedding_gemini ON TABLE node COLUMNS embedding_gemini 
  MTREE DIMENSION 768 
  DIST COSINE 
  TYPE F32;

-- Metadata
DEFINE FIELD metadata       ON TABLE node TYPE object;
DEFINE FIELD media          ON TABLE node TYPE array<object>; -- Stores MediaItem objects
DEFINE FIELD created_at     ON TABLE node TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at     ON TABLE node TYPE datetime VALUE time::now();
`;