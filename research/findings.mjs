// Editorial synthesis of the source-checked collection, not a pooled effect estimate.
// Each paragraph names the paper records that support its specific claims.
export const findings = [
  {
    id:'representation',
    title:'Memory takes several forms',
    paragraphs:[
      {text:'The papers do not describe one common memory component. Some retain a chronological record of actions and decisions; others distill trajectories into reusable skills, maintain structured project facts, or compress the active working context. These forms answer different needs. A log can preserve what happened, a skill bank can preserve a procedure, and a graph can express how a decision relates to a code artifact. Treating all three as interchangeable would hide the design choices that matter for retrieval and maintenance.',sources:['2606.23752','2605.25430','2608.13662']},
      {text:'The physical file format is usually a separate question. ESAA-Conversational explicitly describes a JSON Lines event store and Markdown and JSON projections, while MOOSEDev describes an ontology-grounded knowledge graph. The former specifies file types; the latter specifies a logical representation. In this collection, exact formats or backends are established for only three papers, so the site categorizes all papers by the reported form of memory and leaves unverified file types unknown.',sources:['2606.23752','2608.13662']},
      {text:'This distinction suggests a practical reading strategy: first ask what the agent needs to remember and how that information is organized, then ask how the system serializes or indexes it. The evidence reviewed here supports a varied design space rather than a preferred universal storage format.',sources:['2606.23752','2605.25430','2608.13662']}
    ]
  },
  {
    id:'relevance',
    title:'Relevance matters more than memory volume',
    paragraphs:[
      {text:'Repository Memory draws on prior commits, linked issues, and summaries of changing modules to help an agent locate code relevant to a new bug report. ReasoningBank instead extracts strategies from successful and unsuccessful attempts for reuse on later tasks. Both approaches make prior experience available through a task-specific retrieval step. They illustrate why the usefulness of a memory depends on the relationship between the retained information and the work now being done.',sources:['2510.01003','2509.25140']},
      {text:'The negative result is equally important. CTIM-Rover added general and repository-level episodic memory to a software engineering agent but did not outperform its baseline configurations. Its authors identify distracting retrieved items and example trajectories as a likely source of degradation. More stored experience therefore cannot be treated as a benefit by itself; admission rules, retrieval precision, and presentation within the agent’s context all affect whether a record is useful.',sources:['2505.23422']},
      {text:'The outcome measures also set a boundary. Repository Memory reports gains in code localization, which is a component of a repair workflow rather than a completed fix. The three studies use different agents, tasks, and memory construction methods, so they do not support a common numerical estimate of the effect of memory on software repair.',sources:['2510.01003','2505.23422','2509.25140']}
    ]
  },
  {
    id:'continuity',
    title:'Persistence must be paired with delivery',
    paragraphs:[
      {text:'Long-running coding work loses context when sessions end, agents change, or histories are compressed. PROJECTMEM records issues, attempts, fixes, decisions, and notes as typed events, then projects them into compact summaries and warnings before a new edit. SIx Harness similarly treats project memory and session-start checks as part of the operational environment. These systems shift attention from merely saving a record to making past decisions available at the point of use.',sources:['2606.12329','2609.05510']},
      {text:'Cue-Anchored Memory makes the delivery problem explicit. It associates operational facts with path, symbol, event, temporal, and semantic triggers so a harness can inject a matching fact without waiting for the agent to ask for it. Its controlled probes report reliable delivery through repeated compaction, while voluntary use of a seeded store was rare in that setting. The result is a reminder that a complete archive can still be ineffective if the agent never encounters the relevant item.',sources:['2607.20972']},
      {text:'These studies establish useful mechanisms and operational observations, but their evidence is narrower than a claim of broadly improved coding performance. The delivery probe tests a specific task and compaction setup, and the deployment reports do not isolate memory from every other part of the agent system. Future evaluations need to connect timely delivery to completed, independently checked software outcomes.',sources:['2607.20972','2606.12329','2609.05510']}
    ]
  },
  {
    id:'cost',
    title:'Compression changes cost and information quality',
    paragraphs:[
      {text:'Coding agents need to carry context through long interactions, but every retained span competes for attention and tokens. Work on context compression separates several operations that are often grouped together: filtering a schema, shortening retrieved source material, and summarizing the interaction history. Those operations change different parts of the prompt and may have different effects on later turns. A shorter prompt on one step does not by itself establish a cheaper or better full task.',sources:['2609.22114']},
      {text:'CoMem explores a different tradeoff by running a trained memory model asynchronously beside the coding agent. This can overlap summarization work with inference, while also allowing the stored summary to lag the latest task state. CTIM-Rover provides a quality warning from the retrieval side: extra episodic examples can introduce distracting material. Together, these papers suggest that a memory system should be assessed for latency, token use, freshness, and task quality rather than compression ratio alone.',sources:['2605.30842','2505.23422']},
      {text:'The relative cost of these designs depends on serving conditions, cache behavior, model prices, and how often an agent must return to the original source. The collection does not contain a standardized cost comparison across methods, so the evidence supports identifying tradeoffs rather than ranking one compression strategy as universally best.',sources:['2609.22114','2605.30842']}
    ]
  },
  {
    id:'currency',
    title:'Stored knowledge can become stale',
    paragraphs:[
      {text:'A repository changes after a memory is written. An old statement about an API, file, or decision may still look relevant even when it has been superseded. Temporal Validity models software facts as subject-relation-object records with explicit supersession and tests whether retrieval favors current values over stale ones. EA-Graph takes another route, anchoring verification claims to the artifacts that supported them and checking which claims remain justified after upstream changes.',sources:['2608.20685','2608.04278']},
      {text:'MemGuard addresses uncertainty at admission and retrieval by attaching verifier-derived confidence to candidate experiences and carrying those signals through conflict handling, summarization, and archival. Together, these methods make memory maintenance a first-class part of the lifecycle. Keeping a fact is insufficient if the system cannot tell when its source changed, whether it conflicts with a newer record, or how much trust the agent should place in it.',sources:['2608.21867','2608.20685','2608.04278']},
      {text:'Each evaluation has a defined scope. Temporal Validity uses clean atomic transitions from software histories, and EA-Graph evaluates artifact-level claims in a controlled testbed. The evidence shows concrete ways to manage stale knowledge, while leaving open how these controls behave under broader, messier repository changes and whether they improve end-to-end repair quality.',sources:['2608.20685','2608.04278']}
    ]
  },
  {
    id:'evaluation',
    title:'Evaluation must match the claimed benefit',
    paragraphs:[
      {text:'The reviewed papers measure different outcomes: finding the relevant code, reusing an experience, retaining a fact across sessions, passing executable checks, reducing latency, or operating reliably over time. These are related but not equivalent. Repository Memory evaluates localization, while DreamBench-SWE asks whether information from an earlier session supports later software tasks judged by hidden executable oracles. A positive result on one outcome cannot be silently promoted to a claim about another.',sources:['2510.01003','2608.20664']},
      {text:'VibeMemBench provides a useful contrast between available experience and delivered experience. On targets selected because prior history helped in a reference setting, direct injection improved executable task resolution for four of five held-out solvers by 1.1 to 4.5 percentage points; when existing memory systems had to construct and retrieve that experience, eleven of twelve system–solver pairings did not beat the matched memory-off baseline. DreamBench-SWE similarly separates memory-bearing conditions but reports that some planned mechanism comparisons were unavailable. These benchmark choices define the populations and comparisons to which their results apply.',sources:['2609.23570','2608.20664']},
      {text:'The collection itself is a targeted research snapshot rather than a systematic review. Most records were checked against abstracts, and the papers vary in agents, repositories, budgets, baselines, and metrics. The defensible conclusion is a map of mechanisms, reported results, and open questions. It is not a pooled estimate of how much memory improves coding agents or a leaderboard of systems.',sources:['2510.01003','2608.20664','2609.23570']}
    ]
  }
];
