import type { ProjectPage } from './types';

const x: ProjectPage = {
  slug: 'agentic-rag-ip',
  title: 'Agentic RAG for IP',
  tagline:
    'A Llama Stack retrieval agent over USPTO patent XML: parse full-text patents, embed and index them, and answer questions with a tool-using agent that searches the index before it replies.',
  status: 'Prototype · indexes a small patent sample',
  summary: [
    'The pipeline parses USPTO full-text patent XML into a title, abstract and description, wraps each patent as a Llama Stack `Document`, and inserts it into a registered vector database through the RAG tool runtime, using all-MiniLM-L6-v2 embeddings and 512-token chunks.',
    'A Llama Stack `Agent` given the built-in `knowledge_search` tool answers each question. It retrieves matching chunks from the patent index and then generates an answer with the configured Llama model (the README uses Llama-3.1-8B-Instruct through the Together distribution).',
    'A FastAPI server builds the index and the agent session at startup and exposes one `/query` endpoint. A React page sends questions to it and keeps a short query history. A separate set of scripts tries the same patents in a Weaviate Cloud collection.',
  ],
  problem: [
    'Patent documents are long, highly structured XML full of boilerplate, and keyword search over them misses claims that use different wording. Prior-art and IP research needs answers that come from the actual documents, not from what a model happens to remember.',
    'This project is a first step: turn raw patent XML into clean text, index it semantically, and have an agent decide when to search that index before answering.',
  ],
  highlights: [
    {
      title: 'Structure-aware XML parsing',
      body: 'The parser walks the patent DOM: it takes the `invention-title`, joins the abstract’s `<p>` elements, and rebuilds the description from its children. Heading elements (ids starting with “h”) get a trailing colon and paragraphs (“p”) follow them. The result is readable text that keeps the section structure, with no markup left.',
    },
    {
      title: 'Agent with a retrieval tool, not a fixed retrieve-then-prompt chain',
      body: 'The agent is created with `builtin::rag/knowledge_search` bound to the patent vector DB and told to act as a patent expert assistant. Llama Stack’s agent loop decides when to call the tool, then turns the retrieved chunks into the answer.',
    },
    {
      title: 'All setup at startup',
      body: 'A FastAPI lifespan handler starts Llama Stack in-process as a library client, registers a fresh vector DB, inserts the documents, and creates the agent and session before the server accepts any requests. Blocking SDK calls run through `asyncio.to_thread`, so they don’t conflict with the server’s event loop.',
    },
    {
      title: 'Second vector-store experiment',
      body: '`weaviateDB.py` connects to Weaviate Cloud using environment variables, with three connection retries. It creates a `PatentProject` collection (title, abstract and description, with Weaviate embeddings and a Cohere generative config) and batch-imports the same parsed patents. Import stops early after more than 10 batch errors.',
    },
  ],
  techStack: [
    { name: 'Python · xml.dom.minidom', role: 'USPTO patent XML → title, abstract, description' },
    { name: 'Llama Stack (library client + agents)', role: 'Vector DB registration, RAG tool runtime, tool-using Agent and sessions' },
    { name: 'all-MiniLM-L6-v2', role: '384-dimension embeddings for the patent chunks' },
    { name: 'FAISS (Llama Stack vector_io)', role: 'Vector store provided by the Together distribution’s default vector_io provider' },
    { name: 'Together AI · Llama 3.1 8B Instruct', role: 'Inference model, set through the INFERENCE_MODEL environment variable' },
    { name: 'FastAPI', role: 'Startup indexing plus a POST /query endpoint' },
    { name: 'React + Vite + Tailwind', role: 'Query page with a 10 s timeout and the last 10 queries as history' },
    { name: 'Weaviate Cloud', role: 'Alternative hosted vector store tried in a separate ingestion script' },
  ],
  architecture: {
    groups: [
      { id: 'ui', label: 'Client' },
      { id: 'app', label: 'FastAPI + Llama Stack' },
      { id: 'data', label: 'Patents & index' },
      { id: 'external', label: 'Model provider' },
      { id: 'exp', label: 'Weaviate experiment' },
    ],
    nodes: [
      {
        id: 'frontend',
        label: 'Patent query UI',
        kind: 'ui',
        x: 0,
        y: 160,
        group: 'ui',
        summary: 'Ask a question; see the agent’s answer and recent history.',
        details:
          'Posts `{ user_query }` to `/query` and gives up after 10 seconds. It strips `<inference>` markers and newlines from the logged response before showing it, and keeps the last 10 query/answer pairs with timestamps.',
        tech: ['React', 'Vite', 'Tailwind'],
        codePath: 'patent-frontend/src/App.jsx',
      },
      {
        id: 'server',
        label: 'FastAPI server',
        kind: 'service',
        x: 280,
        y: 160,
        group: 'app',
        summary: 'Builds the index and agent at startup; serves POST /query.',
        details:
          'The lifespan handler starts the Llama Stack client, loads patent documents, registers a vector DB with a unique name, inserts the documents, and creates the agent and one session. `/query` runs `agent.create_turn` in a worker thread and returns the event log of the turn as text. CORS is open for local development.',
        tech: ['FastAPI', 'asyncio', 'uvicorn'],
        codePath: 'server.py',
      },
      {
        id: 'parser',
        label: 'Patent XML parser',
        kind: 'worker',
        x: 560,
        y: 0,
        group: 'data',
        summary: 'parse_patent_xml() → title, abstract, description, file ID.',
        details:
          'Reads one USPTO full-text XML file with minidom. The description keeps headings as “Heading:” prefixes before their paragraphs. The file attribute becomes the document ID. The server indexes the first 10 files in the folder.',
        tech: ['xml.dom.minidom'],
        codePath: 'XMLPatent.py',
      },
      {
        id: 'xml',
        label: 'USPTO patent XML',
        kind: 'datastore',
        x: 840,
        y: 0,
        group: 'data',
        summary: 'Sample US grants from Dec 2024 – Jan 2025.',
        details:
          'A small set of full-text patent grant files (for example US12167705) is checked into the repository as the test corpus.',
        tech: ['USPTO XML'],
        codePath: 'XML/US12167705-20241217.XML',
      },
      {
        id: 'llamastack',
        label: 'Llama Stack runtime',
        kind: 'service',
        x: 560,
        y: 160,
        group: 'app',
        summary: 'In-process library client from the “together” template.',
        details:
          'Provides the vector_io, tool_runtime (RAG) and inference APIs behind one client. The server takes the first vector_io provider it finds to register the patent DB. The README also describes running the same Together distribution as a Docker container.',
        tech: ['llama-stack', 'llama-stack-client'],
      },
      {
        id: 'vectordb',
        label: 'Patent vector DB',
        kind: 'datastore',
        x: 840,
        y: 160,
        group: 'data',
        summary: 'MiniLM embeddings (384-d) over 512-token chunks.',
        details:
          'Registered with `embedding_model="all-MiniLM-L6-v2"` and `embedding_dimension=384`. `rag_tool.insert` chunks each document into 512-token pieces before embedding. In the Together distribution the default vector_io provider is FAISS.',
        tech: ['FAISS', 'all-MiniLM-L6-v2'],
      },
      {
        id: 'agent',
        label: 'Patent RAG agent',
        kind: 'worker',
        x: 560,
        y: 320,
        group: 'app',
        summary: 'Agent with builtin::rag/knowledge_search on the patent DB.',
        details:
          'Instructed to answer from the provided documents in clear English and without markup tags. Session persistence is off, so the session lasts as long as the server process.',
        tech: ['Llama Stack Agents'],
        codePath: 'server.py',
      },
      {
        id: 'llm',
        label: 'Together AI · Llama 3.1',
        kind: 'external',
        x: 840,
        y: 320,
        group: 'external',
        summary: 'Hosted inference for the agent’s answers.',
        details:
          'The model ID comes from INFERENCE_MODEL (the README uses meta-llama/Llama-3.1-8B-Instruct), and the API key comes from the environment.',
        tech: ['Together AI', 'Llama 3.1 8B Instruct'],
      },
      {
        id: 'weaviate-ingest',
        label: 'Weaviate ingestion script',
        kind: 'worker',
        x: 280,
        y: 480,
        group: 'exp',
        summary: 'Batch-imports parsed patents into a cloud collection.',
        details:
          'Reuses the same XML parser and connects with up to three retries. It creates or reuses the `PatentProject` collection, imports up to 10 patents in a dynamic batch, logs files that failed to parse, and fetches 5 objects as a check.',
        tech: ['weaviate-client v4'],
        codePath: 'weaviateDB.py',
      },
      {
        id: 'weaviate',
        label: 'Weaviate Cloud',
        kind: 'external',
        x: 560,
        y: 480,
        group: 'exp',
        summary: 'Hosted vector store with built-in vectorizer.',
        details:
          'The collection uses text2vec-weaviate embeddings and a Cohere generative configuration, so the cluster embeds the text itself instead of the client sending vectors.',
        tech: ['Weaviate', 'Cohere'],
      },
    ],
    edges: [
      { id: 'e-ui-server', source: 'frontend', target: 'server', label: 'POST /query { user_query }' },
      { id: 'e-server-parser', source: 'server', target: 'parser', label: 'parse first 10 patents' },
      { id: 'e-parser-xml', source: 'parser', target: 'xml', label: 'read XML' },
      { id: 'e-server-ls', source: 'server', target: 'llamastack', label: 'LlamaStackAsLibraryClient("together")' },
      { id: 'e-ls-vdb', source: 'llamastack', target: 'vectordb', label: 'register · rag_tool.insert (512-token chunks)' },
      { id: 'e-server-agent', source: 'server', target: 'agent', label: 'create_turn(session)' },
      { id: 'e-agent-vdb', source: 'agent', target: 'vectordb', label: 'knowledge_search' },
      { id: 'e-agent-llm', source: 'agent', target: 'llm', label: 'chat completion' },
      { id: 'e-wv-parser', source: 'weaviate-ingest', target: 'parser', label: 'same parser' },
      { id: 'e-wv-cloud', source: 'weaviate-ingest', target: 'weaviate', label: 'batch import' },
    ],
    traces: [
      {
        id: 'startup-index',
        name: 'Startup: index the patents',
        description: 'Everything the server does before it accepts the first question.',
        steps: [
          {
            edgeId: 'e-server-ls',
            title: 'Start Llama Stack in-process',
            caption: 'The lifespan handler builds a library client from the Together template and initializes it inside the server’s event loop.',
          },
          {
            edgeId: 'e-server-parser',
            title: 'Parse the sample',
            caption: 'The first 10 XML files are parsed into “TITLE: …, ABSTRACT: …, DESCRIPTION: …” documents, each keyed by its file ID.',
          },
          {
            edgeId: 'e-parser-xml',
            title: 'Read the raw grants',
            caption: 'minidom loads each USPTO full-text file. Headings and paragraphs are flattened into plain text in their original order.',
          },
          {
            edgeId: 'e-ls-vdb',
            title: 'Register and fill the index',
            caption: 'A new patent-vector-db-<uuid> is registered with 384-d MiniLM embeddings, and the documents are chunked into 512 tokens and inserted.',
          },
          {
            nodeId: 'agent',
            title: 'Create the agent and session',
            caption: 'An Agent bound to knowledge_search over that DB is created with one session, and the server starts accepting requests.',
          },
        ],
      },
      {
        id: 'ask',
        name: 'Ask a patent question',
        description: 'One query from the React page to a grounded answer.',
        steps: [
          {
            edgeId: 'e-ui-server',
            title: 'Send the question',
            caption: 'The page posts the question and starts a 10-second timeout.',
          },
          {
            edgeId: 'e-server-agent',
            title: 'Start a turn',
            caption: 'The server adds the question as a user message in the session. The blocking call runs in a worker thread.',
          },
          {
            edgeId: 'e-agent-vdb',
            title: 'Search the patents',
            caption: 'The agent calls knowledge_search, which embeds the question and returns the closest patent chunks.',
          },
          {
            edgeId: 'e-agent-llm',
            title: 'Generate the answer',
            caption: 'The retrieved chunks and the question go to the Llama model, which writes the answer.',
          },
          {
            edgeId: 'e-ui-server',
            reverse: true,
            title: 'Show and remember',
            caption: 'The turn’s event log comes back as text. The page removes inference markers, shows the answer, and adds it to the last-10 history.',
          },
        ],
      },
    ],
  },
  install: {
    intro: 'Needs a Together AI API key. The repository README gives the environment variables below.',
    steps: [
      { label: 'Configure the model', code: 'export TOGETHER_API_KEY=...\nexport INFERENCE_MODEL=meta-llama/Llama-3.1-8B-Instruct' },
      { label: 'Start the API', code: 'python server.py  # serves POST /query on :8000' },
      { label: 'Start the UI', code: 'cd patent-frontend && npm install && npm run dev' },
    ],
  },
  links: { github: 'https://github.com/rzarka1298/AgenticRagForIP' },
};

export default x;
