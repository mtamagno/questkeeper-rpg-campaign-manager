# QuestKeeper remote AI provider matrix

**Evidence reviewed:** 22 October 2026  
**Applies to:** QuestKeeper 1.1.2 planning and later  
**Maintainer warning:** provider models, prices, limits and privacy terms change
quickly. Treat this page as stale after **22 November 2026** until the monthly
ecosystem review confirms it again.

This matrix answers a deliberately narrow question: which QuestKeeper job can a
configured model perform honestly? A provider name alone never grants a
capability. The Manager must filter choices by the selected model and must show
the destination, model, task and transmitted content before a remote request.

## Capability legend

- **Supported** — the provider documents the capability and QuestKeeper can
  build a deterministic adapter for it.
- **Model-dependent** — only some models or account tiers support it; the model
  catalog must say so.
- **Unsupported** — the provider does not offer that role directly.
- **Unverified** — official evidence was insufficient at the review date; the
  role stays hidden.

## Provider and transport matrix

| Provider             | API, authentication and discovery                                                                                                                             | Transport                                                                                                  | Text and structured output                                                                                                        | Vision / files                                                                                                                                                        | Image generation                                                                                                                   | Tools / browser                                                              | Operational and privacy notes                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenAI**           | Bearer API key; configurable base URL; [Models API](https://developers.openai.com/api/reference/resources/models/methods/list)                                | Baseline Responses and Images adapters                                                                     | **Supported**; JSON-schema support is model-dependent                                                                             | **Model-dependent**; image and file limits belong to the selected model                                                                                               | **Model-dependent**; image jobs can be synchronous or asynchronous by endpoint/model                                               | **Model-dependent**; never imply autonomous browser access from a model name | Keep the key server-side. Show current [pricing](https://openai.com/api/pricing/) and [data controls](https://platform.openai.com/docs/guides/your-data) before consent. Normalise HTTP status, provider request ID and retry hints.                                                |
| **xAI / Grok**       | Bearer API key; configurable `https://api.x.ai/v1` base URL; [Models endpoint](https://docs.x.ai/developers/rest-api-reference/inference/models)              | OpenAI-compatible text transport with an xAI capability mapper; Imagine uses its documented image endpoint | **Supported**; [structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) are model-dependent  | **Model-dependent**; [image understanding](https://docs.x.ai/developers/model-capabilities/images/understanding) depends on the chosen model                          | **Model-dependent** through [Imagine](https://docs.x.ai/developers/model-capabilities/imagine); do not offer text-only Grok models | **Model-dependent**; web/tool availability must come from catalog metadata   | Keep the key server-side. Link [security and retention controls](https://docs.x.ai/developers/faq/security) and [pricing](https://docs.x.ai/developers/models) in consent. Preserve xAI request IDs and `Retry-After`; never fall back to another vendor silently.                  |
| **Google Gemini**    | API key or supported Google auth; configurable API root; model discovery through the native Gemini API                                                        | **Native adapter required**                                                                                | **Supported**; [structured output](https://ai.google.dev/gemini-api/docs/structured-output) uses a documented JSON-schema subset  | **Supported/model-dependent**; native multimodal requests and [document processing](https://ai.google.dev/gemini-api/docs/document-processing) have model/file limits | **Model-dependent** through eligible image models; response parts may contain inline image data                                    | **Model-dependent**; grounding/tools are separate capabilities               | Keep credentials server-side. Show [pricing](https://ai.google.dev/gemini-api/docs/pricing) and [terms/data use](https://ai.google.dev/gemini-api/terms) before consent. Normalise native `error.status`, HTTP status and retry metadata.                                           |
| **Anthropic Claude** | `x-api-key` plus API-version header; configurable API root; [Models API](https://platform.claude.com/docs/en/api/models/list)                                 | **Native Messages adapter required**                                                                       | **Supported**; [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) are model-dependent | **Supported/model-dependent** through [vision](https://platform.claude.com/docs/en/build-with-claude/vision)                                                          | **Unsupported** as a direct image renderer                                                                                         | **Model-dependent**; tools are not equivalent to browser control             | Hide Anthropic from the image-renderer role. Show [pricing](https://platform.claude.com/docs/en/about-claude/pricing) and [privacy](https://privacy.anthropic.com/) before consent. Normalise native error types and request IDs.                                                   |
| **Mistral AI**       | Bearer API key; configurable API root; model catalog documented under [Models](https://docs.mistral.ai/models)                                                | **Native adapter recommended**; compatibility must be proven per endpoint                                  | **Supported/model-dependent**; structured work commonly uses function calling                                                     | **Model-dependent**                                                                                                                                                   | **Unverified** for QuestKeeper's direct image-renderer role, therefore hidden                                                      | **Model-dependent**                                                          | Keep credentials server-side. EU hosting is the documented default, but the GM must still review [privacy](https://mistral.ai/terms/#privacy-policy), [pricing](https://docs.mistral.ai/inference/pricing) and [known limits](https://docs.mistral.ai/resources/known-limitations). |
| **OpenRouter**       | Bearer API key; configurable API root; [Models API](https://openrouter.ai/docs/api/api-reference/models/get-models) exposes modalities, parameters and prices | OpenAI-compatible gateway plus an explicit routing/privacy policy layer                                    | **Model-dependent**                                                                                                               | **Model-dependent**                                                                                                                                                   | **Model-dependent**                                                                                                                | **Model-dependent**                                                          | The gateway may route to multiple providers. Require a pinned model/provider policy and expose [privacy](https://openrouter.ai/privacy/) and per-model pricing before consent. Automatic cross-provider fallback is off by default.                                                 |

“Model-dependent” remains unavailable until discovery or a maintained catalog
marks the exact model as eligible. Custom model IDs are allowed, but the user
must explicitly assign and confirm their capabilities.

## Limits QuestKeeper must surface

The APIs do not share one durable file-limit contract. Before sending a sheet
screenshot, PDF or large set of notes, an adapter must report:

1. accepted MIME types and whether the file is inline, uploaded first or passed
   by URL;
2. per-file, request and context limits returned by discovery or maintained
   provider metadata;
3. whether an image request completes immediately or requires polling;
4. estimated input/output cost when official token or image prices make that
   possible, otherwise **Cost unknown**;
5. the provider's retention/training link and the exact material being sent.

Limits that cannot be verified are not guessed. The Manager must offer a local
or manual path instead.

## Minimum adapter contracts

Parent issue #1 can remain small if it implements five interfaces:

```text
ProviderRegistry
  metadata() -> name, transport, links, local/remote
  discoverModels(secret, baseUrl) -> NormalizedModel[]
  testConnection(config) -> VerifiedReadiness

StructuredTextAdapter
  generate({ model, schema, instructions, content, media[] }) -> JSON

ImageAdapter
  generate({ model, prompt, references[], size }) -> image or job

ConsentPolicy
  preview({ provider, model, role, transmittedFields, costEstimate })

ErrorNormalizer
  normalize(response) -> code, safeMessage, requestId, retryAfter, retryable
```

`NormalizedModel.capabilities` is an explicit set drawn from `text`,
`structured-output`, `vision`, `image-prompt`, `image-generation` and `web`.
Configuration stores independent selections for prose, extraction, image-prompt
planning and image rendering.

## Deterministic contract fixtures

CI uses recorded, synthetic responses—never paid live calls. Every adapter must
prove:

- discovery maps two differently capable models without promoting missing
  capabilities;
- unsupported roles are filtered before submission and rejected again by the
  server;
- API keys and authorization headers never enter public configuration, logs or
  error messages;
- consent contains the exact provider, model, role and transmitted field/media
  summary;
- malformed structured output fails safely without overwriting campaign data;
- 401/403, 404/model unavailable, 429 with retry metadata and provider 5xx
  errors become the same safe QuestKeeper error contract;
- asynchronous image jobs poll only within a bounded timeout and can be
  cancelled;
- a provider failure never switches provider, model or privacy destination
  without a new user choice.

## Independently deliverable implementation order

1. **Capability registry, consent and normalized errors** — shared foundation;
   no new remote provider yet.
2. **xAI/Grok adapter** — reuses the compatible text transport, then adds
   Imagine behind the image-generation capability.
3. **Gemini native adapter** — proves the native request, media and structured
   response boundary.
4. **Anthropic adapter** — prose, extraction and image-prompt planning only;
   image rendering remains unavailable.
5. **Mistral adapter** — after exact user demand and fixture coverage.
6. **OpenRouter gateway** — only after explicit provider pinning and privacy
   controls; no default automatic routing.

The monthly review may reorder later adapters, but it may not bypass the shared
capability, consent, secret-redaction and mock-test contracts.
