# AI Engineering Design Principles And Best Practices

This document distills the repository into durable engineering guidance. Use it
as a reference for designing, building, evaluating, and operating
production-grade LLM and agent applications.

## Core Mental Model

AI engineering is the practice of building systems around language models that
are useful, observable, reliable, and improvable. The model is only one component.
The surrounding harness controls context, tools, retrieval, memory, evaluation,
security, cost, and user experience.

The central design question is:

```text
What should the model know, remember, retrieve, call, and refuse at this step?
```

Most quality improvements come from better context engineering, not from simply
using a larger model.

## Foundational Patterns

| Pattern | What it controls | Use it when |
| --- | --- | --- |
| Prompt engineering | Instructions, examples, tone, constraints, and output format in the context window. | The model already has enough knowledge, but needs behavioral guidance. |
| RAG | External knowledge retrieved into context before generation. | The answer depends on private, fresh, domain-specific, or source-grounded information. |
| Agents | A model-driven loop with tools, state, and control flow. | The system must decide actions dynamically, call tools, or complete multi-step tasks. |
| Memory | Stored state that can be recalled across turns or sessions. | User preferences, prior interactions, durable facts, or procedures should influence future behavior. |
| Evaluation | Repeatable checks of output quality, retrieval quality, tool use, and safety. | You need to compare changes, prevent regressions, or operate the system with confidence. |
| Fine-tuning | Model behavior changed through training. | Prompting and retrieval cannot reliably produce the desired behavior, or the behavior must be cheaper/faster at scale. |

## Context Engineering

Context engineering is broader than prompt writing. It is the design of everything
placed in, omitted from, compressed into, or made accessible through the model's
context window.

Good context engineering practices:

- Treat context as scarce. Every token should serve the current user goal.
- Separate durable instructions from dynamic context.
- Keep system instructions short, explicit, and enforceable.
- Put task-specific constraints close to the user request or tool call they affect.
- Prefer structured context over long prose when the model must follow rules.
- Include source metadata when retrieved content may need inspection or citation.
- Avoid mixing untrusted retrieved text with trusted system instructions.
- Summarize or compact long conversation history deliberately, and preserve facts that matter.
- Use routing to decide which context sources are relevant instead of dumping everything into the prompt.
- Log the final assembled prompt/context for debugging when policy and privacy allow it.

Common failure modes:

- The model receives irrelevant context and overfits to it.
- Critical source material is retrieved but buried too deep.
- User-provided or retrieved text overrides intended instructions.
- Summaries drop details that later become important.
- Hidden context makes debugging impossible.

## RAG Design Principles

RAG is not just vector search. It is an information pipeline:

```text
source documents -> parsing -> chunking -> indexing -> retrieval -> ranking -> context formatting -> generation -> evaluation
```

Best practices:

- Start with a simple baseline before adding advanced retrieval.
- Preserve metadata at ingestion: source, page, section, timestamp, owner, permissions, and chunk lineage.
- Make chunking match the structure of the source material.
- Consider semantic chunking when the source lacks reliable structure; let embedding similarity place chunk boundaries.
- Use chunk overlap to protect boundary information, but monitor redundancy.
- Tune retrieval `k` as a precision/recall tradeoff, not as a magic constant.
- Inspect retrieved context before inspecting generated answers.
- Evaluate retrieval separately from generation.
- Use keyword or hybrid search when exact names, codes, identifiers, or rare terms matter.
- Use parent-document retrieval when small chunks find relevant material but larger sections are needed for answer quality.
- Use reranking or contextual compression when first-pass retrieval is broad or noisy.
- Distinguish reciprocal rank fusion, which merges ranked lists by position, from reranking, which re-scores candidates with a model.
- Track cost and latency alongside quality metrics.

RAG quality questions:

- Did the retriever find the right evidence?
- Did it omit critical evidence?
- Did it include distracting or contradictory evidence?
- Did the generator faithfully use the retrieved context?
- Can a human trace the answer back to its sources?

## Retrieval Method Selection

| Method | Strength | Risk |
| --- | --- | --- |
| Dense vector retrieval | Finds semantic similarity and paraphrases. | Can miss exact terms and retrieve plausible but unsupported chunks. |
| BM25 or keyword search | Handles exact strings, rare terms, product codes, names, and error messages. | Misses paraphrases and conceptual matches. |
| Hybrid or ensemble retrieval | Combines sparse and dense strengths. | Adds complexity and tuning burden. |
| Maximal marginal relevance (MMR) | Reduces redundancy by balancing relevance with diversity in the result set. | Diversity tuning can drop the single most relevant chunk if set too aggressively. |
| Multi-query retrieval | Expands weak or ambiguous user queries. | Can increase cost and retrieve off-topic context. |
| Parent-document retrieval | Returns broader source context after precise child-chunk search. | Can add too much context if parent sections are large. |
| Graph retrieval | Follows explicit relationships between entities. | Requires high-quality extraction, normalization, and maintenance. |
| Reranking | Improves final context selection after broad retrieval. | Adds latency, cost, and another model dependency. |

Prefer the simplest retriever that satisfies the user need, then prove the need
for more advanced retrieval with metrics and trace inspection.

## Agent Design Principles

An agent is a model plus a harness. The harness defines tools, state, control
flow, budgets, policies, and observability.

Best practices:

- Use agents only when dynamic decision-making is needed.
- Prefer deterministic workflows when the sequence of steps is known.
- Give tools narrow, typed interfaces with clear argument schemas.
- Make tool names and descriptions precise enough that the model can choose correctly.
- Validate tool inputs before execution.
- Put hard safety, authorization, and business rules outside the model.
- Add step limits, tool-call budgets, and timeout controls.
- Treat tool outputs as untrusted unless they come from trusted systems.
- Stream or record intermediate steps for debugging.
- Separate final-answer quality from process quality.
- Design explicit fallback behavior when tools fail.
- Insert human-in-the-loop checkpoints (for example, confirm scope) before expensive or irreversible multi-step work.
- Add structure for the capabilities of today's models, but design so it can be removed as models improve (the bitter lesson).

Agent failure modes:

- The agent skips a necessary tool.
- The agent calls the right tool with wrong arguments.
- The agent loops or repeatedly calls tools.
- The final answer is plausible but unsupported by tool results.
- The agent handles out-of-scope requests instead of refusing or routing.
- Tool output injects instructions back into the agent.

## LangGraph And Workflow Design

Graph-based orchestration is useful when state and control flow matter.

Good graph design:

- Keep graph state explicit and typed.
- Give each node one clear responsibility.
- Use conditional edges for routing decisions that must be inspectable.
- Use deterministic guards for scope, authorization, or policy-critical decisions.
- Keep model-driven routing where flexibility is useful but low risk.
- Make retry, error, and terminal states explicit.
- Visualize the graph during development.
- Log state transitions and node outputs.

Use high-level agent APIs for fast prototypes. Move to explicit graphs when you
need stronger control, reproducibility, observability, or safety.

## Memory Design

Memory is stored context. It is a data-management problem, not a magic model
feature.

Memory types:

| Type | Stores | Example use |
| --- | --- | --- |
| Short-term memory | Thread-level conversation state. | Follow-up questions in one conversation. |
| Semantic memory | Durable facts and preferences. | User profile, cat name, preferred answer format. |
| Episodic memory | Past experiences and outcomes. | What worked in a prior planning session. |
| Procedural memory | Approved instructions or routines. | Preferred workflow, response policy, checklist. |

Best practices:

- Require user consent for durable personal memory.
- Namespace memory by user, tenant, application, and purpose.
- Store only information that has a clear future use.
- Support correction and deletion.
- Avoid storing sensitive data unless necessary and authorized.
- Retrieve memory selectively; do not inject all memory into every prompt.
- Distinguish user-stated facts from inferred facts.
- Track provenance: when and why memory was created.
- Review procedural memory before it changes agent behavior.
- Test cross-user isolation.

Memory failure modes:

- Stale memory overrides current user intent.
- Inferred memory is treated as fact.
- Private memory leaks across users or tenants.
- Too much memory clutters the context window.
- Memory writes happen without user awareness.

## Multi-Agent Systems

Multi-agent architecture is primarily a context-management and specialization
strategy. It should not be the default.

Use multiple agents when:

- Different roles require different context, tools, or policies.
- Work can be cleanly delegated and recomposed.
- Independent specialists reduce context pollution.
- Separate traces make the system easier to inspect.
- The task benefits from review, critique, or verification loops.

Avoid multiple agents when:

- A deterministic workflow is enough.
- The same model sees the same context under different names.
- Coordination overhead exceeds task complexity.
- Failures become harder to attribute.
- You cannot evaluate each role independently.

Best practices:

- Define handoff contracts explicitly.
- Keep each worker's scope narrow.
- Give supervisors structured outputs, not raw transcripts.
- Limit each worker's tool budget.
- Track cost and latency per role.
- Audit citations and source claims deterministically where possible.
- Add verification as a separate responsibility from generation.
- Gather research from parallel workers first, then synthesize in a single writing step; forced per-section parallel writing tends to produce disjoint output.

## Evaluation Principles

Evaluation is how AI systems become improvable. A score is evidence, not a verdict.

Core loop:

```text
baseline -> controlled change -> re-score -> inspect traces -> decide
```

Best practices:

- Start with small, high-signal eval sets.
- Include realistic user examples, edge cases, and adversarial cases.
- Review synthetic examples before treating them as references.
- Change one variable at a time when comparing systems.
- Evaluate components separately: retrieval, generation, tool use, routing, and safety.
- Keep representative traces for passing and failing cases.
- Score the same normalized trace you inspect, so evaluation and debugging never diverge.
- Use both automated metrics and human review.
- Track cost, latency, and reliability with quality.
- Turn important failures into regression cases.
- Do not optimize blindly for aggregate scores.

RAG metrics to understand:

- Context recall: did retrieval find enough relevant support?
- Context precision: how much retrieved content was actually relevant?
- Faithfulness: is the answer supported by retrieved context?
- Answer correctness: does the answer satisfy the reference expectation?
- Noise sensitivity: does irrelevant context distort the answer?

Agent metrics to understand:

- Tool-call accuracy: did the agent call the expected tool with correct arguments?
- Goal accuracy: did the final outcome satisfy the task?
- Topic adherence: did the agent stay within its intended domain?
- Process efficiency: did it complete the task without unnecessary steps?

## Observability And Debugging

LLM applications need traces, not just logs.

Capture when appropriate:

- User input
- Final assembled prompt or message list
- Retrieved documents and scores
- Tool calls and arguments
- Tool outputs
- Model responses
- Token usage
- Latency
- Errors and retries
- Evaluator results

Debug in this order:

1. Was the user's intent understood correctly?
2. Was the right context retrieved or recalled?
3. Was irrelevant context included?
4. Did the model receive clear instructions?
5. Were tools called correctly?
6. Did the final answer follow the evidence?
7. Did policy, routing, or guardrails behave as intended?

## Safety, Security, And Governance

Security boundaries cannot depend on model obedience alone.

Best practices:

- Never commit secrets.
- Load API keys through environment variables or a secret manager.
- Treat retrieved documents, uploaded files, and tool outputs as untrusted input.
- Enforce authorization before retrieval or tool execution.
- Filter retrieval by user, tenant, permissions, and data classification.
- Validate tool arguments server-side.
- Rate-limit expensive or risky tool paths.
- Add explicit refusal behavior for out-of-scope or unsafe requests.
- Separate medical, legal, financial, or safety-critical information from generic advice.
- Include human review for consequential workflows.

## Cost And Latency Discipline

Quality must be balanced against operational cost.

Best practices:

- Track token usage by feature and workflow.
- Set model-call, tool-call, and search-call budgets.
- Cache stable retrieval and embedding work where appropriate.
- Keep eval development sets small until the pipeline is stable.
- Use cheaper models for routing or extraction only when quality is sufficient.
- Prefer deterministic code over model calls for simple classification, validation, or formatting.
- Measure p50, p95, and failure rates, not only average latency.

## Production Readiness Checklist

Before treating an LLM feature as production-grade, verify:

- The system has a clear baseline behavior.
- Inputs, retrieved context, tool calls, and outputs are traceable.
- Retrieval quality has been inspected separately from answer quality.
- Tool schemas are narrow and validated.
- State and memory are namespaced and permissioned.
- Secrets are not stored in code, logs, traces, or shared artifacts.
- Expected refusals and out-of-scope behavior are tested.
- Regression cases exist for known failures.
- Cost and latency are measured.
- There is a rollback or disable path.
- Human review exists where consequences justify it.

## Further Reading

These references are useful for the principles above:

| Topic | References |
| --- | --- |
| In-context learning | [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165), [Chain-of-Thought Prompting Elicits Reasoning](https://arxiv.org/abs/2201.11903), [Principled Instructions Are All You Need](https://arxiv.org/abs/2312.16171) |
| RAG foundations | [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401), [The LLM Application Stack](https://a16z.com/emerging-architectures-for-llm-applications/), [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/) |
| Agents and orchestration | [ReAct](https://arxiv.org/abs/2210.03629), [Thinking in LangGraph](https://docs.langchain.com/oss/python/langgraph/thinking-in-langgraph), [Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents), [Context engineering in agents](https://docs.langchain.com/oss/python/langchain/context-engineering) |
| Memory and graph retrieval | [LangGraph memory overview](https://docs.langchain.com/oss/python/concepts/memory), [Microsoft GraphRAG](https://microsoft.github.io/graphrag/), [From Local to Global: A Graph RAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130), [Stanford CS520 Knowledge Graphs](https://cs520.stanford.edu/) |
| Multi-agent and deep research | [Don't Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents), [Context Rot](https://research.trychroma.com/context-rot), [Deep Agents](https://blog.langchain.com/deep-agents), [The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html), [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Deep Research Bench](https://deepresearch-bench.github.io/) |
| Evaluation | [RAGAS](https://arxiv.org/abs/2309.15217), [Ragas synthetic test data generation](https://docs.ragas.io/en/v0.1.21/concepts/testset_generation.html), [LLM-as-a-Judge](https://en.wikipedia.org/wiki/LLM-as-a-Judge), [Self-Refine](https://arxiv.org/abs/2303.17651), [In Defense of Evals](https://www.sh-reya.com/blog/in-defense-ai-evals/) |
| Advanced retrieval | [BM25](https://www.nowpublishers.com/article/Details/INR-019), [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf), [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard) |
| Engineering workflow | [Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell), [Working with Remotes](https://git-scm.com/book/ms/v2/Git-Basics-Working-with-Remotes), [Cursor rules](https://cursor.com/docs/context/rules), [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices), [Not All AI-Assisted Programming Is Vibe-Coding](https://simonwillison.net/2025/Mar/19/vibe-coding/) |
