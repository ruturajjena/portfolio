/* ═══════════════════════════════════════════════════════════════════
   RUTURAJ JENA — content model. Single source of truth for all copy.
   Only verified facts and links live here. Nothing is invented.
   ═══════════════════════════════════════════════════════════════════ */

export const SITE = {
  name: "Ruturaj Jena",
  title: "Ruturaj Jena — Data Engineer, Designer & Builder",
  description:
    "Ruturaj Jena is a Data Engineer, Web Designer and builder creating scalable data systems and immersive digital experiences.",
  url: "https://ruturajjena.github.io",
  email: "ruturajjena2020@outlook.com",
  location: "Hyderabad, India",
  links: {
    linkedin: "https://www.linkedin.com/in/ruturajjena",
    github: "https://github.com/ruturajjena",
    macrova: "https://macrova.in",
  },
} as const;

export type SectionId =
  | "hero" | "positioning" | "data" | "skills" | "builds" | "macrova"
  | "design" | "brand" | "about" | "contact";

export const NAV: { id: SectionId; label: string }[] = [
  { id: "data", label: "Data" },
  { id: "design", label: "Design" },
  { id: "builds", label: "Builds" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export const HERO = {
  headline: ["I engineer systems.", "I design experiences."],
  roles: "Data Engineer · Web Designer · Builder",
  founder: "Founder of Brand Motion Studios · Builder of Macrova",
  scrollHint: "Scroll",
} as const;

export const POSITIONING = {
  lines: ["Data engineer by discipline.", "Designer by obsession.", "Builder by choice."],
  body:
    "I work across cloud data platforms, distributed systems and digital experiences — combining engineering precision with visual thinking to build products and experiences that are both technically strong and visually memorable.",
} as const;

export type Stage = { id: string; label: string; index: string; body: string };

export const DATA_STAGES: Stage[] = [
  { id: "raw", index: "01", label: "Raw data", body: "Unstructured. Unordered. Arriving from everywhere at once." },
  { id: "ingestion", index: "02", label: "Ingestion", body: "Sources converge into streams. Batch and change-data-capture land side by side." },
  { id: "transformation", index: "03", label: "Transformation", body: "Streams pass through processing. Records become schemas, schemas become tables." },
  { id: "intelligence", index: "04", label: "Intelligence", body: "Relationships and lineage appear. The platform starts to know what it holds." },
  { id: "production", index: "05", label: "Production", body: "A governed, observable distributed system. Boring at 3am, by design." },
];

export const DATA_INTRO = {
  eyebrow: "Data engineering",
  title: "From raw to production.",
} as const;

export type Skill = {
  name: string;
  /** path under /public, or null for the monogram fallback (no real logo exists — e.g. "SQL" is a language, not a brand) */
  logo: string | null;
  /**
   * "aws"   — official AWS Architecture Icon: a pre-coloured square badge, shown muted and revealed to full colour on hover.
   * "brand" — official single-colour brand mark (currentColor); tinted to `color` on hover.
   * "mono"  — no logo exists; rendered as a typographic monogram tile.
   */
  kind: "aws" | "brand" | "mono";
  color?: string;
  /** letters for the monogram tile (mono kind only) */
  monogram?: string;
};

export const SKILL_GROUPS: { title: string; items: Skill[] }[] = [
  {
    title: "Cloud & storage",
    items: [
      { name: "AWS", logo: "/assets/logos/brand/aws.svg", kind: "brand", color: "#FF9900" },
      { name: "S3", logo: "/assets/logos/aws/s3.svg", kind: "aws" },
      { name: "Lake Formation", logo: "/assets/logos/aws/lake-formation.svg", kind: "aws" },
      { name: "Redshift", logo: "/assets/logos/aws/redshift.svg", kind: "aws" },
      { name: "Athena", logo: "/assets/logos/aws/athena.svg", kind: "aws" },
    ],
  },
  {
    title: "Compute & streaming",
    items: [
      { name: "Spark", logo: "/assets/logos/brand/spark.svg", kind: "brand", color: "#E25A1C" },
      { name: "PySpark", logo: "/assets/logos/brand/python.svg", kind: "brand", color: "#3776AB" },
      { name: "AWS Glue", logo: "/assets/logos/aws/glue.svg", kind: "aws" },
      { name: "Kafka", logo: "/assets/logos/brand/kafka.svg", kind: "brand", color: "#000000" },
      { name: "Amazon MSK", logo: "/assets/logos/aws/msk.svg", kind: "aws" },
    ],
  },
  {
    title: "Orchestration & code",
    items: [
      { name: "Airflow", logo: "/assets/logos/brand/airflow.svg", kind: "brand", color: "#017CEE" },
      { name: "MWAA", logo: "/assets/logos/aws/mwaa.svg", kind: "aws" },
      { name: "Terraform", logo: "/assets/logos/brand/terraform.svg", kind: "brand", color: "#7B42BC" },
      { name: "Python", logo: "/assets/logos/brand/python.svg", kind: "brand", color: "#3776AB" },
      { name: "SQL", logo: null, kind: "mono", monogram: "SQL" },
    ],
  },
];

/* ─────────── the pipeline diagram ─────────── */

export type PipelineNode = {
  id: string;
  /** centre in a 1440 × 800 canvas */
  x: number;
  y: number;
  label: string;
  sub: string;
  body: string;
  /** which Skill renders the tile — by name from SKILL_GROUPS, or an inline one */
  skill: string | Skill;
  labelPos?: "bottom" | "top" | "none";
};
export type PipelineEdge = { from: string; to: string; kind: "data" | "control"; label?: string; route?: "h" | "v" };
/** a dashed boundary drawn behind the nodes, e.g. the VPC */
export type PipelineGroup = { id: string; x: number; y: number; w: number; h: number; label: string };
export type PipelineZone = { label: string; x: number };

const aws = (name: string, file: string): Skill => ({ name, logo: `/assets/logos/aws/${file}.svg`, kind: "aws" });
const general = (name: string, file: string): Skill => ({ name, logo: `/assets/logos/general/${file}.svg`, kind: "brand", color: "#2f6bff" });

export const PIPELINE_INTRO =
  "One lakehouse, end to end: relational CDC, key-value streams, documents and SaaS APIs land through DMS, MSK and Glue into a governed S3 lake, served by Athena and Redshift. Airflow schedules it, SNS and SQS trigger it, IAM and Lake Formation govern it, and the compute sits inside a VPC. Hover a service for its role. Trace a record to follow one through.";

export const PIPELINE: {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  groups: PipelineGroup[];
  zones: PipelineZone[];
  lanes: [string, string][][];
  skillToNode: Record<string, string>;
} = {
  nodes: [
    /* ── sources ── */
    { id: "rdbms", x: 80, y: 100, label: "RDBMS", sub: "Postgres · MySQL", body: "Operational relational databases — the system of record, read without disturbing the transactions running on it.", skill: aws("RDBMS", "rds") },
    { id: "docs", x: 80, y: 250, label: "Unstructured", sub: "Docs · logs · media", body: "Files that arrive with no schema at all: documents, log drops, images and audio landing straight in the lake.", skill: general("Unstructured", "documents") },
    { id: "dynamo", x: 80, y: 400, label: "DynamoDB", sub: "Key-value at scale", body: "High-throughput key-value data; its change stream is published as events rather than polled.", skill: aws("DynamoDB", "dynamodb") },
    { id: "apis", x: 80, y: 550, label: "SaaS APIs", sub: "REST · webhooks", body: "Third-party systems that only speak HTTP — pulled on a schedule or pushed in as webhooks.", skill: general("SaaS APIs", "internet") },

    /* ── ingest ── */
    { id: "dms", x: 300, y: 100, label: "DMS", sub: "CDC replication", body: "Change data capture: every insert, update and delete replicated continuously, without a nightly full extract.", skill: aws("DMS", "dms") },
    { id: "kafka", x: 300, y: 475, label: "Kafka", sub: "Event streams", body: "Producers publish to topics, consumers read them in order and at their own pace. The buffer between fast and slow systems.", skill: "Kafka" },
    { id: "msk", x: 520, y: 475, label: "Amazon MSK", sub: "Managed Kafka", body: "Kafka without babysitting the cluster — brokers, patching and scaling handled by AWS, inside the VPC.", skill: "Amazon MSK" },
    { id: "s3raw", x: 520, y: 100, label: "S3 landing", sub: "Raw zone", body: "Everything lands here first, unchanged. Raw data is immutable, so any downstream mistake can be replayed.", skill: "S3" },

    /* ── event-driven trigger chain ── */
    { id: "sns", x: 730, y: 100, label: "SNS", sub: "Object events", body: "An object lands and S3 publishes a notification — a fan-out point, so several consumers can react to the same event.", skill: aws("SNS", "sns") },
    { id: "sqs", x: 940, y: 100, label: "SQS", sub: "Durable queue", body: "The queue absorbs bursts and holds each message until a job has actually processed it, with a dead-letter queue for the ones that fail.", skill: aws("SQS", "sqs") },

    /* ── core ── */
    { id: "glue", x: 760, y: 450, label: "AWS Glue", sub: "Spark · PySpark", body: "Serverless Spark. Batch ETL and streaming jobs in PySpark, catalogued as they land so the schema is never a guess.", skill: "AWS Glue" },
    { id: "s3cur", x: 1010, y: 450, label: "S3 curated", sub: "Governed tables", body: "Modelled, partitioned open-format tables — the consumption layer everything downstream reads.", skill: "S3" },

    /* ── consume ── */
    { id: "athena", x: 1250, y: 330, label: "Athena", sub: "SQL on the lake", body: "Serverless SQL straight over S3 — no copies, so nothing goes stale.", skill: "Athena" },
    { id: "redshift", x: 1250, y: 570, label: "Redshift", sub: "Warehouse", body: "The serving layer for heavy analytical workloads and BI concurrency.", skill: "Redshift" },

    /* ── platform & governance ── */
    { id: "airflow", x: 300, y: 700, label: "Airflow", sub: "DAGs", body: "DAGs describe what runs after what, with retries and backfills built in.", skill: "Airflow" },
    { id: "mwaa", x: 520, y: 700, label: "MWAA", sub: "Managed Airflow", body: "Airflow as a managed service — the scheduler that starts every job on time.", skill: "MWAA" },
    { id: "ssm", x: 760, y: 700, label: "SSM", sub: "Parameters", body: "Parameter Store keeps connection strings and job config out of the code and out of the repo.", skill: aws("SSM", "ssm") },
    { id: "iam", x: 1010, y: 700, label: "IAM", sub: "Least privilege", body: "Roles scoped to the job, not the person. Every service assumes only what it needs for as long as it needs it.", skill: aws("IAM", "iam") },
    { id: "lakeformation", x: 1250, y: 700, label: "Lake Formation", sub: "Table permissions", body: "Fine-grained permissions on the lake: who may read which tables, columns and rows.", skill: "Lake Formation" },

    /* ── the VPC boundary chip ── */
    { id: "vpc", x: 492, y: 385, label: "VPC", sub: "Private subnets", body: "The streaming brokers and Spark workers run on private subnets; S3 is reached over a gateway endpoint rather than the open internet.", skill: aws("VPC", "vpc"), labelPos: "none" },
  ],
  edges: [
    { from: "rdbms", to: "dms", kind: "data" },
    { from: "dms", to: "s3raw", kind: "data" },
    { from: "docs", to: "s3raw", kind: "data" },
    { from: "dynamo", to: "kafka", kind: "data" },
    { from: "apis", to: "kafka", kind: "data" },
    { from: "kafka", to: "msk", kind: "data" },
    { from: "msk", to: "glue", kind: "data" },
    { from: "s3raw", to: "sns", kind: "data" },
    { from: "sns", to: "sqs", kind: "data" },
    { from: "s3raw", to: "glue", kind: "data" },
    { from: "glue", to: "s3cur", kind: "data" },
    { from: "s3cur", to: "athena", kind: "data" },
    { from: "s3cur", to: "redshift", kind: "data" },
    { from: "sqs", to: "glue", kind: "control", label: "triggers" },
    { from: "airflow", to: "mwaa", kind: "control" },
    { from: "mwaa", to: "glue", kind: "control", label: "schedules", route: "h" },
    { from: "ssm", to: "glue", kind: "control", label: "config", route: "h" },
    { from: "iam", to: "s3cur", kind: "control", label: "access", route: "h" },
    { from: "lakeformation", to: "s3cur", kind: "control", label: "governs", route: "h" },
  ],
  groups: [{ id: "vpc-box", x: 452, y: 385, w: 396, h: 175, label: "VPC · PRIVATE SUBNETS" }],
  zones: [
    { label: "Sources", x: 0 },
    { label: "Ingest", x: 200 },
    { label: "Lake", x: 660 },
    { label: "Consume", x: 1150 },
  ],
  lanes: [
    [["rdbms", "dms"], ["dms", "s3raw"], ["s3raw", "glue"], ["glue", "s3cur"], ["s3cur", "redshift"]],
    [["dynamo", "kafka"], ["kafka", "msk"], ["msk", "glue"], ["glue", "s3cur"], ["s3cur", "athena"]],
    [["docs", "s3raw"], ["s3raw", "sns"], ["sns", "sqs"], ["sqs", "glue"], ["glue", "s3cur"], ["s3cur", "athena"]],
  ],
  skillToNode: {
    S3: "s3cur", "Lake Formation": "lakeformation", Redshift: "redshift", Athena: "athena",
    Spark: "glue", PySpark: "glue", "AWS Glue": "glue", Kafka: "kafka", "Amazon MSK": "msk",
    Airflow: "airflow", MWAA: "mwaa", Python: "glue", SQL: "athena", AWS: "iam", Terraform: "vpc",
  },
};

/** The staged run played by the "Run pipeline" button. Each stage lights its
 *  services and sends a burst of packets down its edges. */
export const PIPELINE_RUN: { label: string; nodes: string[]; edges: [string, string][] }[] = [
  { label: "Reading from four sources", nodes: ["rdbms", "docs", "dynamo", "apis"], edges: [["rdbms", "dms"], ["docs", "s3raw"], ["dynamo", "kafka"], ["apis", "kafka"]] },
  { label: "Replicating changes, streaming events", nodes: ["dms", "kafka", "msk"], edges: [["dms", "s3raw"], ["kafka", "msk"]] },
  { label: "Landing raw, untouched, in S3", nodes: ["s3raw"], edges: [["s3raw", "sns"], ["sns", "sqs"]] },
  { label: "SQS triggers the job, MWAA schedules it", nodes: ["airflow", "mwaa", "sns", "sqs", "ssm"], edges: [["airflow", "mwaa"], ["sqs", "glue"], ["mwaa", "glue"], ["ssm", "glue"]] },
  { label: "Transforming in Glue", nodes: ["glue"], edges: [["msk", "glue"], ["s3raw", "glue"]] },
  { label: "Writing governed tables", nodes: ["s3cur", "iam", "lakeformation"], edges: [["glue", "s3cur"], ["iam", "s3cur"], ["lakeformation", "s3cur"]] },
  { label: "Serving Athena and Redshift", nodes: ["athena", "redshift"], edges: [["s3cur", "athena"], ["s3cur", "redshift"]] },
];

export const PIPELINE_RUN_LABELS = {
  idle: "Run pipeline",
  running: "Running",
  done: "Run complete",
  doneStatus: "Run complete — source systems through to the serving layer.",
} as const;

export const skillByName = (name: string): Skill | undefined => SKILL_GROUPS.flatMap((g) => g.items).find((s) => s.name === name);

export const DATA_CONCEPTS = [
  "Lakehouse architecture", "Change data capture", "Streaming ingestion", "Schema evolution",
  "Partitioning & skew", "Data lineage", "Governance", "Infrastructure as code",
];

export type Build = {
  id: string;
  index: string;
  name: string;
  kicker: string;
  description: string;
  role: string;
  tech: string[];
  href?: string;
  hrefLabel?: string;
  visual: "macrova" | "lakehouse" | "generative";
};

export const BUILDS: Build[] = [
  {
    id: "macrova",
    index: "01",
    name: "Macrova",
    kicker: "AI nutrition product",
    description:
      "An AI-powered nutrition and macros tracking product. Point the camera at a plate — the app recognises the food, estimates the macros and adapts the plan.",
    role: "Founder · Product engineer · Design",
    tech: ["Android", "iOS", "Supabase", "Gemini"],
    href: "https://macrova.in",
    hrefLabel: "macrova.in",
    visual: "macrova",
  },
  {
    id: "lakehouse",
    index: "02",
    name: "145-source ingestion platform",
    kicker: "Enterprise lakehouse",
    description:
      "An enterprise ingestion platform reading from 145+ source systems into a three-zone lakehouse — landing, curated, consumption — with an audit-balance-control framework governing every run.",
    role: "Lead architect",
    tech: ["AWS Glue", "DMS", "Step Functions", "Snowflake", "Postgres"],
    visual: "lakehouse",
  },
  {
    id: "generative",
    index: "03",
    name: "Applied generative systems",
    kicker: "Creative technology",
    description:
      "Generative pipelines put to work: prompt-to-sequence video for brand film, AI agents wired into governed enterprise data, and scroll-driven interfaces that hold sixty frames a second.",
    role: "Creative developer",
    tech: ["Amazon Bedrock", "Gemini", "Three.js", "GSAP"],
    visual: "generative",
  },
];

export const MACROVA = {
  eyebrow: "Featured build",
  name: "Macrova",
  tagline: "An AI-powered nutrition and macros tracking product.",
  body:
    "Macrova looks at your plate and does the maths. Food recognition, macro estimation and a plan that adapts to how you actually eat and train — on iOS, Android and the web.",
  capabilities: [
    { label: "AI food scanning", body: "Point the camera at a meal. The model recognises what is on the plate." },
    { label: "Macro estimation", body: "Protein, carbs and fat estimated per item, per portion." },
    { label: "Nutrition tracking", body: "Daily targets, history and progress in one calm dashboard." },
    { label: "Personalised planning", body: "Nutrition and workout plans that adjust as you go." },
  ],
  stages: ["Product", "Layers", "Intelligence", "Interface", "Assembled"],
  href: "https://macrova.in",
  hrefLabel: "macrova.in",
  /** Real product screens from macrova.in. Order matters: [0] is the resting screen in the 3D film. */
  screens: [
    { id: "home", src: "/assets/macrova/macrova-home.webp", alt: "Macrova home screen showing daily calorie and macro targets with an AI explanation", w: 720, h: 1560 },
    { id: "scan", src: "/assets/macrova/macrova-scan.webp", alt: "Macrova analysing a photo of a breakfast plate to identify the food", w: 720, h: 1560 },
    { id: "plan", src: "/assets/macrova/macrova-plan.webp", alt: "Macrova AI workout plan showing a pull session with sets, reps and rest", w: 720, h: 1565 },
  ],
  dashboard: {
    src: "/assets/macrova/macrova-dashboard.webp",
    alt: "Macrova web dashboard showing daily calories, macro rings and a 14-day calorie trend chart",
    w: 1920,
    h: 1200,
  },
} as const;

export const DESIGN_STAGES: Stage[] = [
  { id: "brief", index: "01", label: "Brief", body: "An empty canvas and one sentence about what should exist." },
  { id: "structure", index: "02", label: "Structure", body: "Grid, rhythm and hierarchy. The layout appears before the pixels." },
  { id: "visual", index: "03", label: "Visual system", body: "Type, surfaces and space. A system, not a page." },
  { id: "motion", index: "04", label: "Motion", body: "Elements separate into depth. Timing becomes part of the design." },
  { id: "experience", index: "05", label: "Experience", body: "Everything comes together into something people feel." },
];

export const DESIGN_INTRO = {
  eyebrow: "Web design",
  title: "From brief to experience.",
} as const;

export const BRAND_MOTION = {
  eyebrow: "Founder",
  name: "Brand Motion Studios",
  positioning:
    "A founder-led creative technology studio building AI-generated visuals, cinematic content and premium digital experiences for modern brands.",
  services: ["AI visuals", "Web experiences", "Product visualization", "Motion design", "Creative technology"],
} as const;

export const ABOUT = {
  eyebrow: "About",
  headline: ["Engineering precision.", "Creative instinct."],
  body: [
    "I work across data engineering, cloud architecture and distributed data systems — and, with the same seriousness, across AI, web design and interactive experiences.",
    "The engineering makes the creative work survive contact with reality. The creative work makes the engineering worth looking at.",
  ],
  facts: [
    { k: "Founder", v: "Brand Motion Studios" },
    { k: "Builder", v: "Macrova" },
    { k: "Based", v: "Hyderabad, India" },
  ],
} as const;

export const CONTACT = {
  headline: ["Have a system to build", "or an experience to create?"],
  sub: "Let’s build something memorable.",
  channels: [
    { id: "email", label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { id: "linkedin", label: "LinkedIn", value: "in/ruturajjena", href: SITE.links.linkedin },
    { id: "github", label: "GitHub", value: "@ruturajjena", href: SITE.links.github },
    { id: "macrova", label: "Macrova", value: "macrova.in", href: SITE.links.macrova },
  ],
} as const;
