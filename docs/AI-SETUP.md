# AI setup and session-draft workflow

QuestKeeper can remain completely manual, use models on the same computer, or
connect to an explicitly chosen remote OpenAI API account. AI is optional in
every campaign and generated material is never published automatically.

## Open the interactive installer

Launch `setup.bat` on Windows, `setup.command` on macOS or `./setup.sh` on
Linux. On first launch, Campaign Manager opens **AI setup** automatically. You
can return to it from the sidebar at any time.

The installer reports the detected processor, logical CPU cores, RAM and—when
the operating system exposes it—graphics memory. It then recommends a prose
model and explains whether local image generation looks practical. A
recommendation is not an automatic installation: the Game Master chooses the
provider and model, accepts any applicable model license and starts each
download.

## Prose choices

### Manual

Choose **Off**. Session fields remain ordinary editable forms.

### Local with Ollama

1. Install [Ollama](https://ollama.com/download) and leave its local service
   running.
2. Choose **Local · Ollama**.
3. Select one of the models recommended for the detected RAM and CPU.
4. Choose **Download selected model**. The Manager calls Ollama's local pull
   API and shows progress in its log.
5. Choose **Test prose provider**, then save the setup.

The default local URL is `http://127.0.0.1:11434`. QuestKeeper uses Ollama's
[structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
so a recap arrives as predictable session fields instead of an unstructured
block of text.

### Remote with OpenAI

Choose **Remote · OpenAI API**, enter an API key and select the desired text
model. The key is written only to `.campaign-manager/ai-config.json`, which is
ignored by Git, and is never returned to the browser after saving.

Remote processing has two consent gates: choosing the provider during setup
and confirming each processing task in the session editor. QuestKeeper does
not silently fall back from a failed local provider to a remote one. API usage
may incur provider charges.

## Image choices

### Manual

Choose **Off** and upload licensed or original art through the normal forms.

### Local with ComfyUI

1. Install and start [ComfyUI](https://docs.comfy.org/installation/desktop).
2. Choose **Local · ComfyUI** and enter its installation folder. The folder
   must contain `models/checkpoints`.
3. Review the selected checkpoint's linked license and tick the acceptance
   box.
4. Choose **Download checkpoint**. QuestKeeper writes the model directly to
   ComfyUI's checkpoint folder and reports download progress.
5. Restart ComfyUI if needed, then choose **Test image provider**.

The bundled workflow targets SDXL Turbo through standard ComfyUI nodes. The
checkpoint is large and local image generation depends heavily on GPU memory;
the installer therefore recommends remote or manual images on unsuitable
hardware instead of pretending CPU and RAM are the only constraints.

### Remote with OpenAI Images

Choose **Remote · OpenAI Images**. It shares the locally stored OpenAI API key
with the prose provider, while retaining a separate image-model choice. Each
session task still requires explicit remote consent.

## Turn notes into a chapter

1. Open a campaign and choose **Sessions**.
2. Add or edit a session.
3. Paste typed notes or a reviewed Discord Scribe transcript into **Raw notes**.
4. Choose **Process notes** or **Process notes with images**.
5. Review the populated title, location, summary, chronicle, cumulative recap
   and key events. Expand optional archive suggestions to inspect their source
   evidence.
6. Edit anything that is incomplete, interpretive or wrong, then choose
   **Save**.

Raw notes are working material and are not copied into the public session JSON.
Profile, location and relationship suggestions are not applied automatically.
Generated images are stored in the campaign only when requested and are
attached to the draft; the Game Master remains responsible for licenses,
continuity, accessibility text and publication.

## Security and privacy boundaries

- Campaign Manager binds to localhost and accepts local-provider URLs only on
  `localhost`, `127.0.0.1` or `::1`.
- API keys and setup choices live under the Git-ignored `.campaign-manager/`
  directory. Never copy that file into an issue or commit.
- Notes are sent only after pressing a processing button. Remote providers
  receive them only after the per-task checkbox is selected.
- Model output is untrusted draft material. Verify names, chronology, speaker
  attribution, rules claims and player choices before saving.
- Use only models, inputs and generated assets whose licenses permit your use.
