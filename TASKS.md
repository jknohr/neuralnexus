# TASKS.md - Neural Nexus Project Audit

> Last Updated: 2025-12-26

---

## ✅ Completed Fixes

### Critical Schema-Service Alignment
- [x] `surrealService.relate()` uses `type` field (not `sourcetype`)
- [x] `edge_schema.ts` has `sourcetype`/`destinationtype` fields
- [x] `embedding_anthropic` naming aligned across all files
- [x] Removed embeddings from `node_archtype_schema.ts`
- [x] Removed `console.log` from `surrealService.ts`

### Medium Priority
- [x] Backblaze returns `{fileId, url}` object
- [x] Added `deleteFile()` method to Backblaze service
- [x] Media delete handler in DocumentViewer
- [x] Citation popup (navigates to nodes or opens external URLs)
- [x] Embedding tracker wired into `handleNodeUpdate`

### Low Priority  
- [x] Fixed `@ts-ignore` in Settings.tsx (used `sourcetype` instead of `type`)

---

## 🔮 Future: AI Voice Pipeline (Deferred)

> **User Vision**: Novel voice pipeline with model selection and shared communication log

### Architecture Notes
- **Model Selection**: User chooses which AI model to talk to (each has situational advantages)
- **Voice Pipeline**: Primary interaction mode
- **Communication Log**: Stored in `neuralindex` database (shared across sessions)
- **Multi-Model**: Support for Gemini, OpenAI, Anthropic with different strengths

### Schema (To Be Defined)
```sql
-- In neuralindex database
DEFINE TABLE communication_log SCHEMAFULL;
DEFINE FIELD session_id ON TABLE communication_log TYPE string;
DEFINE FIELD model ON TABLE communication_log TYPE string; -- gemini, openai, anthropic
DEFINE FIELD role ON TABLE communication_log TYPE string; -- user, assistant
DEFINE FIELD content ON TABLE communication_log TYPE string;
DEFINE FIELD audio_url ON TABLE communication_log TYPE option<string>;
DEFINE FIELD timestamp ON TABLE communication_log TYPE datetime DEFAULT time::now();
DEFINE FIELD project ON TABLE communication_log TYPE option<string>;
DEFINE FIELD context_nodes ON TABLE communication_log TYPE array<string>; -- Node IDs referenced
```

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Services | 8 |
| Components | 6 |
| Schemas | 12 |
| Node Archetypes | 37 (9 child, 28 sub) |
| Edge Taxonomies | 16 (3 child, 5 sub, 8 link) |
