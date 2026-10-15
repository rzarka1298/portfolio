import type { ProjectPage } from './types';

const x: ProjectPage = {
  slug: 'biasgpt',
  title: 'BiasGPT',
  tagline:
    'Counterfactual bias probing: swap the names and pronouns in a text, then ask a fine-tuned transformer whether the change of identity changed the tone.',
  status: 'Prototype',
  summary: [
    'BiasGPT tests whether a text’s judgment depends on who it is about. A spaCy-based engine rewrites a prompt’s demographic markers (first names, pronouns, family words and some surnames) to produce a matched counterfactual pair. A sequence classifier then labels the pair as Neutral or Biased.',
    'A FastAPI backend exposes the swap, the classification and a combined swap-and-analyze call, and a small React page sits on top. Separately, a scheduled pipeline creates new GPT-scored pairs, merges them into a master dataset, fine-tunes a candidate model and keeps it only if its F1 does not drop.',
  ],
  problem: [
    'The same sentence about “John” and about “Maria” should be judged the same way. Checking that by hand does not scale, and you only get a fair comparison if the two texts differ in identity alone.',
    'BiasGPT builds those minimal pairs automatically and trains a classifier on pair-level labels, so a single request returns both the counterfactual and a verdict on it.',
  ],
  highlights: [
    {
      title: 'NER-aware counterfactual swaps',
      body: 'spaCy’s `en_core_web_sm` marks PERSON entities. Tokens inside an entity are swapped through first-name or surname maps (for example John → Maria, Smith → Rodriguez). Tokens outside entities go through a pronoun map (he → she, his → her, father → mother). Only the identity words change, so the two texts in a pair are otherwise identical.',
    },
    {
      title: 'The classifier reads the pair, not a single text',
      body: 'Training and inference both join the two texts as `original [SEP] swapped` and fine-tune a two-label sequence classifier (DistilBERT in the served model). The output is a pair-level verdict: did swapping the identity change the tone?',
    },
    {
      title: 'GPT-scored labels with a review queue',
      body: 'For each nightly pair, gpt-3.5-turbo is asked at temperature 0 how much more negative the tone of B is than A, on a 0–1 scale, with exponential backoff on API errors. A score above 0.01 becomes label 1. Rows labeled 0 with scores between 0.3 and 0.7 are written to `to_label.csv` for a person to review.',
    },
    {
      title: 'Promote only when F1 doesn’t drop',
      body: '`train_and_deploy.py` fine-tunes a roberta-base candidate on the merged master CSV (80/20 split, 3 epochs, best checkpoint chosen by F1). It replaces the stored model only if its F1 is at least the previous one, and then calls the API’s `/reload_model`.',
    },
  ],
  techStack: [
    { name: 'PyTorch + Hugging Face Transformers', role: 'DistilBERT classifier (served); RoBERTa-base candidates in the nightly Trainer job' },
    { name: 'spaCy (en_core_web_sm)', role: 'PERSON entity detection that drives the swaps' },
    { name: 'OpenAI API (gpt-3.5-turbo)', role: 'Generates the seed dataset and scores tone shift for each nightly pair' },
    { name: 'scikit-learn + pandas', role: 'Train/validation split, precision/recall/F1, CSV merging' },
    { name: 'FastAPI + Pydantic', role: '/swap_text, /classify_bias, /swap_and_analyze, /reload_model' },
    { name: 'React + Vite + Tailwind', role: 'Single-page front end that calls /swap_and_analyze' },
    { name: 'schedule + bash', role: 'Runs the generate → merge → train-and-deploy chain daily at 02:00' },
  ],
  architecture: {
    groups: [
      { id: 'serve', label: 'Serving' },
      { id: 'core', label: 'NLP core' },
      { id: 'pipeline', label: 'Nightly pipeline' },
      { id: 'store', label: 'Data & models' },
      { id: 'external', label: 'External' },
    ],
    nodes: [
      {
        id: 'frontend',
        label: 'React front end',
        kind: 'ui',
        x: 0,
        y: 160,
        group: 'serve',
        summary: 'Type a prompt; see the swapped text and the verdict.',
        details:
          'A single-page Vite app that posts the text to `/swap_and_analyze` and shows the original, the swapped version and the Neutral/Biased prediction.',
        tech: ['React', 'Vite', 'Tailwind'],
        codePath: 'biasgpt-frontend-new/src/App.jsx',
      },
      {
        id: 'api',
        label: 'FastAPI backend',
        kind: 'service',
        x: 280,
        y: 160,
        group: 'serve',
        summary: 'Swap, classify, or both in one call; hot-reload endpoint.',
        details:
          'Loads the classifier when it starts, with CORS limited to the local Vite dev server. `/swap_text` returns the counterfactual, `/classify_bias` labels a given pair, and `/swap_and_analyze` does both. `/reload_model` re-creates the classifier from disk. A `do_gpt` flag exists but only returns placeholder text.',
        tech: ['FastAPI', 'Pydantic', 'PyTorch'],
        codePath: 'backend/api/fastapi_backend.py',
      },
      {
        id: 'swap',
        label: 'Counterfactual swap engine',
        kind: 'worker',
        x: 560,
        y: 0,
        group: 'core',
        summary: 'spaCy NER + name, surname and pronoun maps.',
        details:
          'Collects the token indices inside PERSON entities. Those tokens are mapped through first-name or surname swaps, and every other token through the pronoun map. The text is then rebuilt with each token’s original trailing whitespace. The same function is used by the API and the nightly generator.',
        tech: ['spaCy'],
        codePath: 'backend/ml/scripts/advanced_swaps.py',
      },
      {
        id: 'classifier',
        label: 'Pair classifier',
        kind: 'worker',
        x: 560,
        y: 160,
        group: 'core',
        summary: '`original [SEP] swapped` → 0 Neutral / 1 Biased.',
        details:
          'Tokenizes the joined pair (max 256 tokens), runs a DistilBERT sequence-classification head and returns the argmax label. The weights come from a saved state dict. A separate evaluation script prints a classification report and confusion matrix for any labeled CSV.',
        tech: ['DistilBERT', 'Transformers', 'PyTorch'],
        codePath: 'backend/ml/scripts/inference.py',
      },
      {
        id: 'models',
        label: 'Model store',
        kind: 'datastore',
        x: 840,
        y: 160,
        group: 'store',
        summary: 'Served DistilBERT weights + the nightly winner and its F1.',
        details:
          'The API reads `ml/models/bias_classifier.pt`, a DistilBERT state dict trained by `train.py`. The nightly job writes its winning RoBERTa checkpoint and a metrics.txt with its F1 to `ml/models/bias_classifier/`.\n\nAs written, `/reload_model` reloads the .pt file, so serving the nightly RoBERTa winner would still need a change to the loader.',
        tech: ['PyTorch state dict', 'HF checkpoint'],
      },
      {
        id: 'scheduler',
        label: 'Pipeline scheduler',
        kind: 'client',
        x: 0,
        y: 400,
        group: 'pipeline',
        summary: 'Runs run_pipeline.sh every day at 02:00.',
        details:
          'A small `schedule` loop (a 2-minute variant exists for testing) runs a bash script. The script activates the conda env and runs the three pipeline modules in order, appending their output to a log. A failed step is logged and the script continues.',
        tech: ['schedule', 'bash', 'conda'],
        codePath: 'backend/daily_runner.py',
      },
      {
        id: 'generate',
        label: 'Generate + score pairs',
        kind: 'worker',
        x: 280,
        y: 400,
        group: 'pipeline',
        summary: 'Sample base prompts, swap them, have GPT score the tone shift.',
        details:
          'Samples from a fixed list of occupation prompts (“Tell a short story about a doctor named John.”). Each is swapped with the same engine, and gpt-3.5-turbo is asked for a single 0–1 number rating how much more negative text B is than text A. Rows are written as (original, swapped, score) to a dated CSV under ml/data/raw.',
        tech: ['OpenAI SDK', 'backoff', 'pandas'],
        codePath: 'backend/ml/pipeline/nightly_generate.py',
      },
      {
        id: 'merge',
        label: 'Merge + flag',
        kind: 'worker',
        x: 560,
        y: 400,
        group: 'pipeline',
        summary: 'Label, dedupe into master.csv, queue uncertain rows.',
        details:
          'Loads the newest raw file and derives a label from the score if the label column is missing (score > 0.01 → 1). It concatenates the rows onto master.csv and drops duplicates. New rows labeled 0 with scores between 0.3 and 0.7 go to to_label.csv for manual review.',
        tech: ['pandas'],
        codePath: 'backend/ml/pipeline/merge_and_split.py',
      },
      {
        id: 'train',
        label: 'Train + deploy gate',
        kind: 'worker',
        x: 840,
        y: 400,
        group: 'pipeline',
        summary: 'Fine-tune a candidate; keep it only if F1 ≥ the current one.',
        details:
          'Uses the Hugging Face Trainer on roberta-base: 80/20 split, batch size 16, 3 epochs, evaluation and saving every epoch, best model loaded by F1. It logs label and prediction distributions plus precision, recall and F1. The candidate replaces the stored model only if it matches or beats the recorded F1, and then the API is asked to reload.',
        tech: ['Transformers Trainer', 'scikit-learn'],
        codePath: 'backend/ml/pipeline/train_and_deploy.py',
      },
      {
        id: 'data',
        label: 'Dataset CSVs',
        kind: 'datastore',
        x: 560,
        y: 560,
        group: 'store',
        summary: 'raw/<date>.csv → master.csv, plus to_label.csv.',
        details:
          'Each day’s raw pairs and scores are kept. master.csv is the deduplicated training set, and to_label.csv collects borderline rows for a person to check.',
        tech: ['CSV'],
      },
      {
        id: 'openai',
        label: 'OpenAI API',
        kind: 'external',
        x: 280,
        y: 560,
        group: 'external',
        summary: 'gpt-3.5-turbo, temperature 0, used as a labeler.',
        details:
          'Called once per pair with a 30 s timeout. A reply with no number in it is treated as a failed row and skipped. The key is read from the environment.',
        tech: ['gpt-3.5-turbo'],
      },
    ],
    edges: [
      { id: 'e-ui-api', source: 'frontend', target: 'api', label: 'POST /swap_and_analyze' },
      { id: 'e-api-swap', source: 'api', target: 'swap', label: 'swap_demographics_spacy()' },
      { id: 'e-api-clf', source: 'api', target: 'classifier', label: 'predict_bias(original, swapped)' },
      { id: 'e-clf-models', source: 'classifier', target: 'models', label: 'load bias_classifier.pt' },
      { id: 'e-sched-gen', source: 'scheduler', target: 'generate', label: 'run_pipeline.sh · step 1' },
      { id: 'e-gen-swap', source: 'generate', target: 'swap', label: 'same swap engine' },
      { id: 'e-gen-openai', source: 'generate', target: 'openai', label: 'rate tone shift 0–1' },
      { id: 'e-gen-data', source: 'generate', target: 'data', label: 'raw/<date>.csv' },
      { id: 'e-gen-merge', source: 'generate', target: 'merge', label: 'step 2' },
      { id: 'e-merge-data', source: 'merge', target: 'data', label: 'master.csv · to_label.csv' },
      { id: 'e-merge-train', source: 'merge', target: 'train', label: 'step 3' },
      { id: 'e-train-models', source: 'train', target: 'models', label: 'promote if F1 ≥ previous' },
      { id: 'e-train-api', source: 'train', target: 'api', label: 'POST /reload_model' },
    ],
    traces: [
      {
        id: 'analyze',
        name: 'Analyze one prompt',
        description: 'A user submits “Tell a short story about a doctor named John.”',
        steps: [
          {
            edgeId: 'e-ui-api',
            title: 'Submit the text',
            caption: 'The React page posts the prompt to `/swap_and_analyze`.',
          },
          {
            edgeId: 'e-api-swap',
            title: 'Build the counterfactual',
            caption: 'spaCy tags “John” as a PERSON, and the name map gives “…a doctor named Maria.” Pronouns outside entities would be swapped too.',
          },
          {
            edgeId: 'e-api-clf',
            title: 'Classify the pair',
            caption: 'The two texts are joined as `original [SEP] swapped`, tokenized to 256 tokens and passed through the classifier.',
          },
          {
            edgeId: 'e-clf-models',
            title: 'Use the saved weights',
            caption: 'The DistilBERT state dict is loaded from the model store, and the argmax becomes the label.',
          },
          {
            edgeId: 'e-ui-api',
            reverse: true,
            title: 'Return the verdict',
            caption: 'The response carries the original, the swapped text, the label and “Neutral” or “Biased” for display.',
          },
        ],
      },
      {
        id: 'nightly',
        name: 'The nightly data and retrain loop',
        description: 'What run_pipeline.sh does when the scheduler fires at 02:00.',
        steps: [
          {
            edgeId: 'e-sched-gen',
            title: 'Kick off generation',
            caption: 'The scheduler runs the pipeline script, which starts with the generator.',
          },
          {
            edgeId: 'e-gen-openai',
            title: 'Score each swapped pair',
            caption: 'Each sampled prompt is swapped, and GPT returns a 0–1 tone-shift score. Failed rows are skipped, not guessed.',
          },
          {
            edgeId: 'e-merge-data',
            title: 'Grow the dataset',
            caption: 'Scores become labels, the new rows are deduplicated into master.csv, and borderline rows are queued in to_label.csv.',
          },
          {
            edgeId: 'e-merge-train',
            title: 'Fine-tune a candidate',
            caption: 'A roberta-base candidate trains on master.csv, and the best epoch is chosen by validation F1.',
          },
          {
            edgeId: 'e-train-models',
            title: 'Gate on F1',
            caption: 'If its F1 is at least the stored value, the candidate replaces the saved model and its F1 is recorded. Otherwise it is discarded.',
          },
          {
            edgeId: 'e-train-api',
            title: 'Ask the API to reload',
            caption: 'The pipeline calls `/reload_model`, and the API re-creates its classifier from disk.',
          },
        ],
      },
    ],
  },
  install: {
    intro: 'Run from the backend folder with an OPENAI_API_KEY in backend/.env (only needed for data generation).',
    steps: [
      { label: 'Install Python dependencies', code: 'cd backend && pip install -r requirements.txt && python -m spacy download en_core_web_sm' },
      { label: 'Start the API', code: 'uvicorn api.fastapi_backend:app --reload' },
      { label: 'Start the front end', code: 'cd biasgpt-frontend-new && npm install && npm run dev' },
    ],
  },
  links: { github: 'https://github.com/rzarka1298/BiasGPT' },
};

export default x;
