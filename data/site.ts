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
  /** centre in a 1200 × 520 canvas */
  x: number;
  y: number;
  label: string;
  sub: string;
  body: string;
  /** which Skill renders the tile — by name, or an inline mono tile */
  skill: string | Skill;
  labelPos?: "top" | "bottom";
};
export type PipelineEdge = { from: string; to: string; kind: "data" | "control"; label?: string; route?: "h" | "v" };

export const PIPELINE_INTRO =
  "A lakehouse the way I build it: batch sources and event streams land through Glue and MSK into a governed S3 lake, queried in place by Athena and served from Redshift, with Airflow on MWAA deciding what runs when. Hover a service for its role. Trace a record to follow the flow.";

export const PIPELINE: { nodes: PipelineNode[]; edges: PipelineEdge[]; lanes: [string, string][][]; skillToNode: Record<string, string> } = {
  nodes: [
    { id: "sources", x: 80, y: 300, label: "Sources", sub: "DBs · APIs · events", body: "Operational databases, SaaS APIs and application events — raw inputs arriving on their own schedules.", skill: { name: "Sources", logo: null, kind: "mono", monogram: "SRC" } },
    { id: "kafka", x: 330, y: 120, label: "Kafka", sub: "Event streams", body: "Producers publish change events to topics; consumers read them in order, at their own pace.", skill: "Kafka" },
    { id: "msk", x: 540, y: 120, label: "Amazon MSK", sub: "Managed Kafka", body: "Kafka without babysitting the cluster — brokers, patching and scaling handled by AWS.", skill: "Amazon MSK" },
    { id: "lakeformation", x: 900, y: 120, label: "Lake Formation", sub: "Governance", body: "Fine-grained permissions on the lake: who may read which tables, columns and rows.", skill: "Lake Formation", labelPos: "top" },
    { id: "glue", x: 700, y: 300, label: "AWS Glue", sub: "Spark · PySpark · Python", body: "Serverless Spark. Batch ETL and streaming jobs written in PySpark, catalogued as they land.", skill: "AWS Glue" },
    { id: "s3", x: 900, y: 300, label: "Amazon S3", sub: "Data lake", body: "The lake itself: landing, curated and consumption zones as open-format tables on object storage.", skill: "S3" },
    { id: "athena", x: 1110, y: 190, label: "Athena", sub: "SQL on the lake", body: "Serverless SQL straight over S3 — no copies, so nothing goes stale.", skill: "Athena" },
    { id: "redshift", x: 1110, y: 410, label: "Redshift", sub: "Warehouse", body: "The serving layer for heavy analytical workloads and BI.", skill: "Redshift" },
    { id: "airflow", x: 330, y: 480, label: "Airflow", sub: "Orchestration", body: "DAGs describe what runs after what, with retries and backfills built in.", skill: "Airflow" },
    { id: "mwaa", x: 540, y: 480, label: "MWAA", sub: "Managed Airflow", body: "Airflow as a managed service — the scheduler that starts every Glue job on time.", skill: "MWAA" },
  ],
  edges: [
    { from: "sources", to: "glue", kind: "data" },
    { from: "sources", to: "kafka", kind: "data" },
    { from: "kafka", to: "msk", kind: "data" },
    { from: "msk", to: "glue", kind: "data", route: "h" },
    { from: "glue", to: "s3", kind: "data" },
    { from: "s3", to: "athena", kind: "data" },
    { from: "s3", to: "redshift", kind: "data" },
    { from: "airflow", to: "mwaa", kind: "control" },
    { from: "mwaa", to: "glue", kind: "control", label: "orchestrates", route: "h" },
    { from: "lakeformation", to: "s3", kind: "control", label: "governs", route: "v" },
  ],
  lanes: [
    [["sources", "glue"], ["glue", "s3"], ["s3", "redshift"]],
    [["sources", "kafka"], ["kafka", "msk"], ["msk", "glue"], ["glue", "s3"], ["s3", "athena"]],
  ],
  skillToNode: {
    S3: "s3", "Lake Formation": "lakeformation", Redshift: "redshift", Athena: "athena",
    Spark: "glue", PySpark: "glue", "AWS Glue": "glue", Kafka: "kafka", "Amazon MSK": "msk",
    Airflow: "airflow", MWAA: "mwaa", Python: "glue", SQL: "athena",
  },
};

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
