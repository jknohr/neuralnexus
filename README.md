# Neural Nexus

**Neural Nexus** is a next-generation knowledge graph system designed to map, visualize, and interact with complex information structures. Powered by **SurrealDB**, it creates a "Living Graph" where structure and content are strictly defined yet infinitely extensible.

## 🧠 System Architecture

Neural Nexus employs a dual-layer database architecture to separate system management from knowledge content.

### 1. Neural Index (System & Management)
*   **Database**: `neuralindex`
*   **Role**: Acts as the central registry and control plane.
*   **Responsibilities**:
    *   **Project Registry**: Tracks all projects and their specific configurations.
    *   **Global Settings**: Manages API keys (LLM, Storage), UI themes, and user preferences.
    *   **Local Definitions**: Stores project-specific schema customizations that override or extend the global standard.

### 2. Project Databases (Knowledge Graphs)
*   **Database**: `project_name` (One per project)
*   **Role**: Stores the actual knowledge graph (Nodes and Edges).
*   **Structure**: Each project is seeded with the "Standard Library" of Node Archetypes and Edge Taxonomies but can evolve independently.

---

## 📐 The Schema System

The core "Truth" of Neural Nexus is defined by its rigorous schema system, stored natively in SurrealDB.

### Node Archetypes (`node_archtype`)
Defines the *identity* and *behavior* of nodes. Every node in the graph must belong to a valid Archetype.

*   **Nature**:
    *   **`Child`**: Structural containers that define the hierarchy (e.g., `Domain`, `Topic`, `Branch`, `Repo`, `Article`, `Paper`).
    *   **`Sub`**: Informational units that provide content and details (e.g., `Concept`, `Principle`, `File`, `Source`).
*   **Flow Logic**:
    *   Nodes define preferred spatial alignment (`positive`, `negative`, `neutral`, `free`) on X, Y, and Z axes, enabling intelligent 3D layout algorithms.
*   **Connectivity Rules**:
    *   `allowedChildNodes`: What structural nodes can live inside this one?
    *   `allowedSubNodes`: What content nodes can be attached to this one?

### Edge Taxonomies (`edge_taxonomy`)
Defines the *relationships* between nodes. Edges are directional and semantic.

*   **Taxonomy Categories (`type`)**:
    *   **`RELATIONAL`** (Nature: `child`): Strict structural bonds defining hierarchy.
        *   Examples: `PARENT_OF` ↔ `CHILD_OF`, `HAS_PART` ↔ `PART_OF`.
    *   **`DESCRIPTIVE`** (Nature: `sub`): Definition or context assignment.
        *   Examples: `DEFINES` ↔ `DEFINED_BY`, `DESCRIBES` ↔ `DESCRIBED_BY`, `CONTAINS` ↔ `CONTAINED_IN`.
    *   **`LINK`** (Nature: `link`): Associative connections between peers.
        *   Examples: `REFERENCES` ↔ `REFERENCED_BY`, `CITES` ↔ `CITED_BY`, `RELATED_TO` ↔ `RELATED_TO`.

*   **Directional Semantics**:
    *   **`sourcetype`**: The relationship name from the Source node's perspective (e.g., "Parent Of").
    *   **`destinationtype`**: The relationship name from the Target node's perspective (e.g., "Child Of").
    *   This allows nodes to validate connectivity based on their allowed incoming/outgoing roles.

---

## 💾 Data Model

### Content Tables
*   **`node`**: The actual instances of data.
    *   Links to `node_archtype` via the `type` field.
    *   Contains `title`, `summary`, `content`, `data` (Flexible JSON).
    *   **Embeddings**: Supports multiple AI providers simultaneously:
        *   `embedding_gemini`
        *   `embedding_openai`
        *   `embedding_local`
*   **`edge`**: The connections.
    *   Links to `edge_taxonomy` via the `type` field.
    *   SurrealDB Relations: `RELATE source->type->target`.

### Extensibility
The system is built to be extensible.
*   **Global Standards**: A robust set of defaults (Standard Library) is provided out-of-the-box in `schemas/`.
*   **Local Definitions**: Projects can define their own `NodeType`s and `EdgeType`s, which are effectively "merged" into the runtime schema, allowing for domain-specific customization without polluting the global standard.

---

## 🛠️ Tech Stack
*   **Database**: SurrealDB (SurrealQL)
*   **Backend/Services**: TypeScript, Node.js
*   **AI**: Google Gemini (integration via `geminiService`)
*   **Storage**: Backblaze B2 (Media & Assets)
