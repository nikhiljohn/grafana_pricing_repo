"""Provider-agnostic LLM client.

Powers every AI feature using the customer's own key (Bring Your Own Key).
Supports Anthropic Claude, OpenAI, and Google Gemini over their REST APIs
via httpx, so no provider-specific SDK is required.

The active provider + key + model are resolved per-tenant in
``settings_service.get_active_credential``; callers pass those in here.
"""

import logging

import httpx

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("anthropic", "openai", "gemini")

DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-4-5",
    "openai": "gpt-4o",
    "gemini": "gemini-1.5-pro",
}


class LLMError(RuntimeError):
    """Raised when an LLM call fails or is not configured."""


async def ask_llm(
    *,
    provider: str,
    api_key: str,
    model: str | None,
    system: str,
    user: str,
    max_tokens: int = 1024,
) -> str:
    """One-shot completion. Returns the assistant text.

    Raises LLMError if the provider is unsupported, the key is missing,
    or the upstream API returns an error.
    """
    if provider not in SUPPORTED_PROVIDERS:
        raise LLMError(f"Unsupported provider: {provider}")
    if not api_key:
        raise LLMError(f"No API key configured for {provider}")

    model = model or DEFAULT_MODELS[provider]

    async with httpx.AsyncClient(timeout=60.0) as client:
        if provider == "anthropic":
            return await _ask_anthropic(client, api_key, model, system, user, max_tokens)
        if provider == "openai":
            return await _ask_openai(client, api_key, model, system, user, max_tokens)
        return await _ask_gemini(client, api_key, model, system, user, max_tokens)


async def _ask_anthropic(
    client: httpx.AsyncClient,
    api_key: str,
    model: str,
    system: str,
    user: str,
    max_tokens: int,
) -> str:
    resp = await client.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        },
    )
    _raise_for_status(resp, "anthropic")
    data = resp.json()
    return "".join(
        block.get("text", "")
        for block in data.get("content", [])
        if block.get("type") == "text"
    )


async def _ask_openai(
    client: httpx.AsyncClient,
    api_key: str,
    model: str,
    system: str,
    user: str,
    max_tokens: int,
) -> str:
    resp = await client.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "authorization": f"Bearer {api_key}",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
    )
    _raise_for_status(resp, "openai")
    data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _ask_gemini(
    client: httpx.AsyncClient,
    api_key: str,
    model: str,
    system: str,
    user: str,
    max_tokens: int,
) -> str:
    resp = await client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        params={"key": api_key},
        headers={"content-type": "application/json"},
        json={
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"maxOutputTokens": max_tokens},
        },
    )
    _raise_for_status(resp, "gemini")
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts)


def _raise_for_status(resp: httpx.Response, provider: str) -> None:
    if resp.status_code >= 400:
        body = resp.text[:300]
        logger.warning("%s API error %s: %s", provider, resp.status_code, body)
        raise LLMError(f"{provider} API returned {resp.status_code}: {body}")
