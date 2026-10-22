# Monthly AI ecosystem review — 2026-10

**Owner:** Marco Tamagno

**Review date:** 2026-10-22

**Current QuestKeeper release:** 1.1.2

**Related issues:** #1, #8, #9 and #15

## Existing integration health

| Provider   | Current use                                                                              | Official evidence                                                                       | Decision                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Ollama     | Local text, structured drafts and sheet-image input when supported by the selected model | [Structured outputs](https://docs.ollama.com/capabilities/structured-outputs)           | **Keep** as the first local/manual-adjacent path                           |
| ComfyUI    | Local image generation with a user-installed checkpoint                                  | [ComfyUI documentation](https://docs.comfy.org/)                                        | **Keep**; model license and hardware consent remain explicit               |
| OpenAI API | Remote structured prose, vision and images                                               | [Models API](https://developers.openai.com/api/reference/resources/models/methods/list) | **Keep** as the compatibility baseline, but remove provider-name branching |

## Remote candidates

| Provider         | Text / structured                                             | Vision                                      | Image output                                                   | Transport and privacy notes                                                                                                                                                                                                                                                                                                                                          | Decision                                                                                                   |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| xAI / Grok       | Supported; structured JSON schema is documented               | Model-dependent and discoverable            | Supported by Imagine-capable models                            | OpenAI-compatible base URL is documented; model metadata exposes modalities. ZDR and regional behavior are account/endpoint choices. [Models](https://docs.x.ai/developers/rest-api-reference/inference/models), [structured output](https://docs.x.ai/developers/model-capabilities/text/structured-outputs), [security](https://docs.x.ai/developers/faq/security) | **Adopt first** through the compatible transport, with explicit capability filtering                       |
| Google Gemini    | Supported through a native API and JSON-schema subset         | Supported, including document understanding | Supported by eligible models                                   | Native request/response shape; file and media limits differ from OpenAI. [Structured output](https://ai.google.dev/gemini-api/docs/structured-output), [content API](https://ai.google.dev/api/generate-content), [document input](https://ai.google.dev/gemini-api/docs/document-processing)                                                                        | **Adopt first** as the required native adapter                                                             |
| Anthropic Claude | Supported; structured output and strict tools are documented  | Supported                                   | **Unsupported** as a direct image renderer                     | Native Messages API; model endpoint now reports lifecycle and capabilities. [Models](https://platform.claude.com/docs/en/api/models/list), [vision](https://platform.claude.com/docs/en/build-with-claude/vision), [structured output](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)                                                     | **Next adapter** for prose, extraction and prompt planning only                                            |
| Mistral AI       | Supported; function calling is the documented structured path | Model-dependent                             | No general direct image-output role verified for this workflow | Native capabilities vary by model; EU hosting is documented as the default. [Models](https://docs.mistral.ai/models), [limitations](https://docs.mistral.ai/resources/known-limitations), [pricing](https://docs.mistral.ai/inference/pricing)                                                                                                                       | **Watch / later adapter** after the first two transports stabilize                                         |
| OpenRouter       | Model-dependent and exposed in model metadata                 | Model-dependent                             | Model-dependent                                                | OpenAI-compatible gateway, but routing can cross providers and provider data practices vary. Model metadata exposes modalities, parameters, price and ZDR filtering. [Models API](https://openrouter.ai/docs/api/api-reference/models/get-models), [privacy](https://openrouter.ai/privacy/)                                                                         | **Experiment later**; require pinned provider/privacy choices and never enable automatic fallback silently |

Capabilities are intentionally not inferred from a vendor name. A provider can
be configured only for roles its selected model advertises or the maintained
catalog explicitly verifies.

## Architecture decision

The smallest durable adapter contract has five parts:

1. provider metadata, documentation/privacy links and local/remote class;
2. model catalog with per-role capabilities (`text`, `structured-output`,
   `vision`, `image-prompt`, `image-generation`, optional `web`);
3. provider-specific secret storage that is never returned to the browser;
4. text/structured and image transport adapters with normalized errors;
5. one consent preview containing provider, model, task and transmitted scope.

Mock fixtures must prove capability filtering, secret redaction, unsupported
role rejection, rate-limit/error normalization and absence of silent fallback.
Paid live calls are never required in CI.

## Decisions and revisit triggers

| Decision                                         | Trigger                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Implement xAI and Gemini first                   | Registry and mock contracts pass in both repositories                               |
| Add Anthropic next                               | Native adapter contract is stable and image roles are correctly hidden              |
| Keep Mistral visible but not active              | A user need or capability advantage justifies adapter maintenance                   |
| Do not enable OpenRouter auto-routing by default | Revisit only when provider/privacy pinning is explicit in consent and configuration |
| Do not freeze volatile model IDs in core logic   | Discover models when possible and retain validated custom IDs                       |

## Closeout

- [x] Official provider sources reviewed.
- [x] Capabilities classified as supported, unsupported or model-dependent.
- [x] Image-ineligible providers identified.
- [x] Provider-neutral adapter and mock-test contract defined.
- [x] Implementation order recorded.
- [x] No user provider, model or remote fallback changed merely because of this review.
