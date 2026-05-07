import gc
import re
import gradio as gr
import torch
from threading import Thread
from functools import lru_cache
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TextIteratorStreamer,
    BitsAndBytesConfig,
    AutoProcessor,
    Gemma3ForConditionalGeneration,
    Mxfp4Config,
)

# Default output-token budget. Reasoning models (e.g. gpt-oss-20b) spend many
# tokens on an internal analysis channel before producing the final answer, so
# the budget must be large enough to cover both phases.
DEFAULT_MAX_NEW_TOKENS = 4096


def _is_gemma3(model_id: str) -> bool:
    return model_id.startswith("google/gemma-3-")


def _is_qwen3(model_id: str) -> bool:
    return "Qwen3" in model_id


def _is_gpt_oss(model_id: str) -> bool:
    return "gpt-oss" in model_id.lower()


@lru_cache(maxsize=32)
def _get_plain_tokenizer(model_id: str, hf_token: str) -> AutoTokenizer:
    """Return a cached tokenizer for token-counting (no model weights loaded)."""
    return AutoTokenizer.from_pretrained(
        model_id, token=hf_token, trust_remote_code=True
    )


@lru_cache(maxsize=8)
def _get_gemma3_processor(model_id: str, hf_token: str) -> AutoProcessor:
    """Return a cached Gemma 3 processor for token-counting."""
    return AutoProcessor.from_pretrained(
        model_id, token=hf_token, trust_remote_code=True
    )


class LocalModelManager:
    """
    Keeps exactly one model loaded at a time (fits better on a single 24GB GPU).
    Swaps models when dropdown changes.
    """

    def __init__(self) -> None:
        self.model_id: str | None = None
        self.model = None
        self.tokenizer = None
        self.processor = None  # Gemma 3 uses a processor
        self.kind: str | None = None  # "causal" or "gemma3"

    def unload(self) -> None:
        """Release the current model and free GPU memory."""
        self.model_id = None
        self.kind = None
        self.model = None
        self.tokenizer = None
        self.processor = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def cleanup_after_inference(self) -> None:
        """Clean up GPU memory after inference without unloading the model."""
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def load(self, model_id: str, hf_token: str, use_4bit: bool) -> None:
        """Load *model_id* (or reuse it if already loaded), optionally with 4-bit quantization."""
        if self.model_id == model_id and self.model is not None:
            return

        self.unload()

        try:
            quant_cfg = None
            if use_4bit:
                if _is_gpt_oss(model_id):
                    quant_cfg = Mxfp4Config()
                else:
                    quant_cfg = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_quant_type="nf4",
                        bnb_4bit_use_double_quant=True,
                        bnb_4bit_compute_dtype=torch.float16,
                    )

            if _is_gemma3(model_id):
                # Gemma 3: use the dedicated multimodal class + processor (text-only works fine).
                self.kind = "gemma3"
                self.processor = AutoProcessor.from_pretrained(
                    model_id, token=hf_token, trust_remote_code=True
                )
                gemma_kwargs = {
                    "token": hf_token,
                    "device_map": "auto",
                    "dtype": torch.bfloat16,  # good default on L4
                    "trust_remote_code": True,
                }
                if quant_cfg is not None:
                    gemma_kwargs["quantization_config"] = quant_cfg
                self.model = Gemma3ForConditionalGeneration.from_pretrained(
                    model_id,
                    **gemma_kwargs,
                ).eval()
                self.model_id = model_id
                return

            # Default: causal LM + tokenizer
            self.kind = "causal"
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id, token=hf_token, trust_remote_code=True
            )

            model_kwargs = {
                "token": hf_token,
                "device_map": "auto",
                "dtype": torch.bfloat16 if _is_gpt_oss(model_id) else torch.float16,
                "trust_remote_code": True,
                "offload_folder": "/tmp/offload",
            }
            if quant_cfg is not None:
                model_kwargs["quantization_config"] = quant_cfg

            self.model = AutoModelForCausalLM.from_pretrained(
                model_id, **model_kwargs
            ).eval()

            self.model_id = model_id

        except (torch.cuda.OutOfMemoryError, RuntimeError) as e:
            # Clean up on OOM or other runtime errors during loading
            self.unload()
            if "out of memory" in str(e).lower() or "cuda" in str(e).lower():
                raise gr.Error(
                    f"Out of memory loading {model_id}. Try enabling 4-bit quantization or use a smaller model."
                ) from e
            raise

    def build_inputs(
        self,
        system_message: str,
        user_message: str,
        thinking: bool = False,
        reasoning_effort: str = "medium",
    ) -> tuple[dict, AutoTokenizer]:
        """Build tokenised inputs and return *(encoded_inputs, tokenizer_for_streaming)*."""
        if self.kind == "gemma3":
            # Gemma 3 chat template expects typed content.
            messages = [
                {
                    "role": "system",
                    "content": [{"type": "text", "text": system_message}],
                },
                {"role": "user", "content": [{"type": "text", "text": user_message}]},
            ]
            enc = self.processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
            )
            enc = enc.to(self.model.device, dtype=torch.bfloat16)
            tokenizer_for_streaming = self.processor.tokenizer
            return enc, tokenizer_for_streaming

        # Normal instruct models: use tokenizer chat template
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]

        template_kwargs = {}
        if self.model_id and _is_qwen3(self.model_id):
            template_kwargs["enable_thinking"] = thinking
        if self.model_id and _is_gpt_oss(self.model_id):
            template_kwargs["reasoning_effort"] = reasoning_effort

        prompt = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True, **template_kwargs
        )
        enc = self.tokenizer(prompt, return_tensors="pt", add_special_tokens=False)
        enc = {k: v.to(self.model.device) for k, v in enc.items()}
        return enc, self.tokenizer


MANAGER = LocalModelManager()


class StreamHandler:
    """Base interface for processing streamed token pieces into user-visible text."""

    requires_special_tokens = False

    def on_piece(self, piece: str) -> str:
        """Process *piece* and return the full response text to display so far."""
        raise NotImplementedError


class PassThroughHandler(StreamHandler):
    """Returns raw streamed text as-is, with no filtering."""

    def __init__(self) -> None:
        self._text = ""

    def on_piece(self, piece: str) -> str:
        self._text += piece
        return self._text


class QwenThinkHandler(StreamHandler):
    """Strips Qwen3 ``<think>…</think>`` blocks from UI output, logging them to console."""

    _OPEN = "<think>"
    _CLOSE = "</think>"

    def __init__(self) -> None:
        self._raw_text = ""
        self._in_thinking = False

    def on_piece(self, piece: str) -> str:
        self._raw_text += piece
        self._log_thinking(piece)
        return self._visible_text()

    def _log_thinking(self, piece: str) -> None:
        """Stream thinking tokens to the console in real time."""
        if not self._in_thinking and self._OPEN in self._raw_text:
            self._in_thinking = True
            print("\n--- Model thinking ---", flush=True)
            after_tag = self._raw_text.split(self._OPEN, 1)[1]
            if after_tag:
                print(after_tag, end="", flush=True)

        elif self._in_thinking and self._CLOSE not in self._raw_text:
            print(piece, end="", flush=True)

        elif self._in_thinking and self._CLOSE in self._raw_text:
            before_close = piece.split(self._CLOSE, 1)[0]
            if before_close:
                print(before_close, end="", flush=True)
            print("\n--- End thinking ---", flush=True)
            self._in_thinking = False

    def _visible_text(self) -> str:
        """Return the accumulated text with all ``<think>…</think>`` blocks removed."""
        clean = re.sub(r"<think>[\s\S]*?</think>", "", self._raw_text)
        clean = re.sub(r"<think>[\s\S]*$", "", clean)
        return clean.strip()


class HarmonyHandler(StreamHandler):
    """
    Consumes Harmony control tokens and:
      - logs analysis-channel text to the console
      - returns only final-channel text for the UI
    """

    requires_special_tokens = True

    _CHANNEL_RE = re.compile(r"<\|channel\|>(analysis|final)<\|message\|>")
    _STOP_TOKENS = ("<|return|>", "<|end|>", "<|call|>")

    def __init__(self) -> None:
        self._buffer = ""
        self._channel: str | None = None
        self._done = False

        self._final = ""
        self._analysis_header_open = False

    def on_piece(self, piece: str) -> str:
        if self._done:
            return self._final.strip()

        self._buffer += piece

        while self._buffer and not self._done:
            if self._channel is None:
                if not self._seek_channel():
                    break
            elif self._channel == "analysis":
                if not self._drain_analysis():
                    break
            elif self._channel == "final":
                if not self._drain_final():
                    break

        return self._final.strip()

    # -- state-machine steps ---------------------------------------------

    def _seek_channel(self) -> bool:
        """Find the next channel marker. Return *True* to keep looping."""
        m = self._CHANNEL_RE.search(self._buffer)
        if not m:
            return False  # need more text
        # Drop everything before the marker (e.g. <|start|>assistant …)
        self._buffer = self._buffer[m.end():]
        self._channel = m.group(1)
        return True

    def _drain_analysis(self) -> bool:
        """Log analysis text to the console until the next channel marker."""
        m = self._CHANNEL_RE.search(self._buffer)
        if not m:
            self._log_analysis(self._buffer)
            self._buffer = ""
            return False
        self._log_analysis(self._buffer[:m.start()])
        self._buffer = self._buffer[m.start():]
        self._channel = None
        return True

    def _drain_final(self) -> bool:
        """Collect final-channel text until a stop token is found."""
        stop_pos, stop_tok = self._find_stop_token(self._buffer)
        if stop_pos is None:
            self._collect_final(self._buffer)
            self._buffer = ""
            return False
        self._collect_final(self._buffer[:stop_pos])
        self._buffer = self._buffer[stop_pos + len(stop_tok):]
        self._done = True
        return False

    # -- helpers ----------------------------------------------------------

    def _log_analysis(self, text: str) -> None:
        """Print *text* to console under an ``analysis`` header."""
        if not text:
            return
        if not self._analysis_header_open:
            print("\n--- Model analysis (Harmony) ---", flush=True)
            self._analysis_header_open = True
        print(text, end="", flush=True)

    def _collect_final(self, text: str) -> None:
        """Append *text* to the final answer, closing the analysis header if needed."""
        if not text:
            return
        if self._analysis_header_open:
            print("\n--- End analysis ---", flush=True)
            self._analysis_header_open = False
        self._final += text

    def _find_stop_token(self, buf: str) -> tuple[int | None, str | None]:
        """Return *(position, token)* of the earliest stop token, or *(None, None)*."""
        best_pos = None
        best_tok = None
        for tok in self._STOP_TOKENS:
            pos = buf.find(tok)
            if pos != -1 and (best_pos is None or pos < best_pos):
                best_pos = pos
                best_tok = tok
        return best_pos, best_tok


def make_stream_handler(model: str, thinking: bool) -> StreamHandler:
    """Pick the right stream handler for the given *model* and *thinking* flag."""
    if thinking and _is_qwen3(model):
        return QwenThinkHandler()
    if _is_gpt_oss(model):
        return HarmonyHandler()
    return PassThroughHandler()


def respond(
    system_message: str,
    message: str,
    model: str,
    temperature: float,
    max_new_tokens: int,
    use_4bit: bool,
    thinking: bool,
    reasoning_effort: str,
    oauth_token: gr.OAuthToken,
):
    """Stream a model response, yielding progressively updated text for the UI."""
    print(
        f"Generating response using {model} (temperature: {temperature}, "
        f"max_new_tokens: {max_new_tokens}, 4-bit: {use_4bit}, "
        f"thinking: {thinking}, reasoning_effort: {reasoning_effort})"
    )
    if oauth_token is None or not getattr(oauth_token, "token", None):
        # In a private Space you can also fall back to a HF_TOKEN secret,
        # but since you're using LoginButton OAuth, require login here.
        raise gr.Error("Please log in first (missing OAuth token).")

    hf_token = oauth_token.token

    # Load (or reuse) model locally on the Space GPU
    MANAGER.load(model, hf_token=hf_token, use_4bit=use_4bit)

    inputs, stream_tok = MANAGER.build_inputs(
        system_message, message, thinking, reasoning_effort
    )

    handler = make_stream_handler(model, thinking)

    streamer = TextIteratorStreamer(
        stream_tok,
        skip_prompt=True,
        skip_special_tokens=not handler.requires_special_tokens,
    )

    # max_new_tokens limits OUTPUT length; it does not control input size.
    gen_kwargs = dict(
        **inputs,
        max_new_tokens=int(max_new_tokens),
        do_sample=(temperature > 0),
        temperature=temperature if temperature > 0 else None,
        top_p=0.95 if temperature > 0 else None,
        top_k=50 if temperature > 0 else None,
        streamer=streamer,
    )

    # Some models need pad_token_id set
    if hasattr(stream_tok, "pad_token_id") and stream_tok.pad_token_id is None:
        gen_kwargs["pad_token_id"] = stream_tok.eos_token_id

    thread_exception = [None]  # mutable container to capture exception from thread

    def _run_generate():
        try:
            with torch.no_grad():
                MANAGER.model.generate(**gen_kwargs)
        except Exception as e:
            thread_exception[0] = e
            # Unblock the streamer so the main loop doesn't hang forever
            streamer.text_queue.put(streamer.stop_signal)

    thread = Thread(target=_run_generate)
    thread.start()

    for piece in streamer:
        yield handler.on_piece(piece)

    thread.join(timeout=10.0)

    print("Generation thread completed.")

    # Clean up GPU memory after generation completes (or fails)
    MANAGER.cleanup_after_inference()

    # Propagate any exception from the generation thread to the user
    if thread_exception[0] is not None:
        exc = thread_exception[0]
        if (
            isinstance(exc, torch.cuda.OutOfMemoryError)
            or "out of memory" in str(exc).lower()
        ):
            raise gr.Error(
                f"Out of memory during generation with {model}. "
                "Try enabling 4-bit quantization or use a smaller model."
            )
        raise gr.Error(f"Generation failed: {exc}")


def count_tokens(css_input: str, model: str, oauth_token: gr.OAuthToken) -> str:
    """Return a human-readable token count for *css_input* using the selected model's tokenizer."""
    if oauth_token is None or not getattr(oauth_token, "token", None):
        raise gr.Error("Please log in first (missing OAuth token).")

    hf_token = oauth_token.token

    if _is_gemma3(model):
        proc = _get_gemma3_processor(model, hf_token)
        tok = proc.tokenizer
    else:
        tok = _get_plain_tokenizer(model, hf_token)

    tokens = tok.encode(css_input, add_special_tokens=False)
    return f"Token Count: {len(tokens)}"


def update_4bit(model: str) -> bool:
    """
    If the user changes the model selection, we may need to update the 4-bit checkbox state.
    For example, if they switch to a smaller model that fits in memory without 4-bit, we can disable the checkbox.
    Conversely, if they switch to a larger model that requires 4-bit, we can enable it.

    This function checks the new model and updates the checkbox accordingly.
    """
    match model:
        case (
            "openai/gpt-oss-20b" | "Qwen/Qwen2.5-14B-Instruct" | "google/gemma-3-12b-it"
        ):
            return True
        case _:
            return False


def update_model_options(model: str):
    """Return *(4-bit value, thinking visibility, reasoning_effort visibility)* for *model*."""
    return (
        update_4bit(model),
        gr.update(visible=_is_qwen3(model)),
        gr.update(visible=_is_gpt_oss(model)),
    )


# get default prompt from prompt.txt
with open("prompt.txt", "r") as f:
    DEFAULT_PROMPT = f.read()

MODELS = [
    "openai/gpt-oss-20b",
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-14B-Instruct",
    "Qwen/Qwen3-4B-Instruct-2507",
    "Qwen/Qwen3-8B",
    "meta-llama/Llama-3.1-8B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "google/gemma-3-12b-it",
]

DEFAULT_MODEL = MODELS[0]

with gr.Blocks() as demo:
    with gr.Row():
        with gr.Column(scale=1, min_width=200):
            gr.LoginButton()
            model = gr.Dropdown(
                label="Model",
                allow_custom_value=True,
                choices=MODELS,
                value=DEFAULT_MODEL,
            )
            temperature = gr.Slider(
                minimum=0, maximum=4.0, value=0.6, step=0.1, label="Temperature"
            )
            max_new_tokens = gr.Slider(
                minimum=1024,
                maximum=16384,
                value=DEFAULT_MAX_NEW_TOKENS,
                step=256,
                label="Max New Tokens",
            )
            use_4bit = gr.Checkbox(
                label="Use 4-bit Quantization (to fit larger models on GPU)",
                value=update_4bit(DEFAULT_MODEL),
            )
            thinking = gr.Checkbox(
                label="Enable 'Thinking' (Qwen3 only, logs thinking tokens to console)",
                value=False,
                visible=_is_qwen3(DEFAULT_MODEL),
            )
            reasoning_effort = gr.Dropdown(
                label="Reasoning Effort (gpt-oss only)",
                choices=["low", "medium", "high"],
                value="low",
                visible=_is_gpt_oss(DEFAULT_MODEL),
            )
            model.change(
                fn=update_model_options,
                inputs=model,
                outputs=[use_4bit, thinking, reasoning_effort],
                api_name="update_model_options",
            )

        with gr.Column(scale=4):
            system_message = gr.TextArea(
                label="System Message",
                value=DEFAULT_PROMPT,
                placeholder="You can set the behavior of the assistant here.",
                lines=10,
            )
            css_input = gr.TextArea(
                label="CSS Input",
                placeholder="Enter your CSS code here...",
                lines=10,
            )
            with gr.Row():
                submit_button = gr.Button("Submit")
                tokens_button = gr.Button("Count Tokens")
            response = gr.TextArea(
                label="Response",
                placeholder="The model's response will appear here.",
                lines=10,
            )

            tokens_button.click(
                count_tokens,
                inputs=[css_input, model],
                outputs=response,
                api_name="count_tokens",
            )
            submit_button.click(
                respond,
                inputs=[
                    system_message,
                    css_input,
                    model,
                    temperature,
                    max_new_tokens,
                    use_4bit,
                    thinking,
                    reasoning_effort,
                ],
                outputs=response,
                api_name="submit",
            )


if __name__ == "__main__":
    print(f"CUDA available: {torch.cuda.is_available()}")
    print(f"CUDA device: {torch.cuda.get_device_name(torch.cuda.current_device())}")
    print(f"CUDA device capability: {torch.cuda.get_device_capability()}")
    try:
        import triton

        print(f"Triton version: {triton.__version__}")
    except ImportError:
        print("Triton is NOT installed")
    demo.launch(css="textarea { font-family: monospace; }")
