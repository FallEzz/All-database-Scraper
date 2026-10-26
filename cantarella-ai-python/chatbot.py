import os
import urllib.parse
import requests
from typing import List, Dict, Optional

# =====================================================================
# KONFIGURASI PROVIDER GRATIS (AUTO-FALLBACK / ANTI-LIMIT)
# =====================================================================
# Secara default, script ini langsung berjalan TANPA API KEY menggunakan
# Pollinations AI. Jika Anda memiliki API Key gratis dari OpenRouter atau
# Groq, isi di bawah ini (atau lewat environment variable) agar otomatis
# dipakai secara bergantian jika salah satu terkena limit.

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")  # Daftar gratis di https://openrouter.ai/settings/keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")              # Daftar gratis di https://console.groq.com/keys

PROVIDERS = [
    {
        "name": "OpenRouter (Venice Uncensored Free)",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "model": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
        "api_key": OPENROUTER_API_KEY,
        "requires_key": True,
        "format": "openai",
    },
    {
        "name": "Groq (Llama 3.3 70B Free)",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.3-70b-versatile",
        "api_key": GROQ_API_KEY,
        "requires_key": True,
        "format": "openai",
    },
    {
        "name": "Pollinations AI (No API Key / Unlimited Free)",
        "url": "https://text.pollinations.ai/openai",
        "model": "openai-fast",
        "api_key": "",
        "requires_key": False,
        "format": "openai",
    },
    {
        "name": "Pollinations AI Fast GET (No API Key Backup)",
        "url": "https://text.pollinations.ai",
        "model": "openai-fast",
        "api_key": "",
        "requires_key": False,
        "format": "pollinations_get",
    },
]


class MultiProviderChatbot:
    def __init__(self, system_prompt: str = "Kamu adalah asisten AI yang cerdas, membantu, dan menjawab dalam bahasa Indonesia."):
        self.system_prompt = system_prompt
        self.messages: List[Dict[str, str]] = [
            {"role": "system", "content": self.system_prompt}
        ]

    def reset_history(self) -> None:
        """Menghapus riwayat percakapan dan kembali ke system prompt awal."""
        self.messages = [{"role": "system", "content": self.system_prompt}]

    def chat(self, user_input: str) -> Dict[str, str]:
        """Mengirim pesan dan mengembalikan dict berisi 'reply' dan 'provider'."""
        self.messages.append({"role": "user", "content": user_input})
        errors = []

        for provider in PROVIDERS:
            if provider["requires_key"] and not provider["api_key"]:
                continue

            headers = {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0",
            }
            if provider["api_key"]:
                headers["Authorization"] = f"Bearer {provider['api_key']}"

            try:
                reply: Optional[str] = None
                if provider.get("format") == "pollinations_get":
                    encoded = urllib.parse.quote(user_input)
                    get_url = f"{provider['url']}/{encoded}"
                    response = requests.get(
                        get_url,
                        headers={"User-Agent": "Mozilla/5.0"},
                        timeout=30,
                    )
                    response.raise_for_status()
                    reply = response.text.strip()
                else:
                    payload = {
                        "model": provider["model"],
                        "messages": self.messages,
                    }
                    response = requests.post(
                        provider["url"],
                        headers=headers,
                        json=payload,
                        timeout=40,
                    )
                    response.raise_for_status()
                    data = response.json()
                    reply = (
                        data.get("choices", [{}])[0]
                        .get("message", {})
                        .get("content")
                    )

                if reply:
                    self.messages.append({"role": "assistant", "content": reply})
                    return {
                        "reply": reply,
                        "provider": provider["name"],
                        "model": provider["model"],
                    }
                else:
                    errors.append(f"{provider['name']}: Respons kosong")

            except Exception as exc:
                errors.append(f"{provider['name']}: {exc}")
                continue

        # Jika semua gagal, hapus pesan terakhir agar history tidak rusak
        self.messages.pop()
        raise RuntimeError(
            "Semua provider gagal dihubungi:\n- " + "\n- ".join(errors)
        )

    def send_message(self, user_input: str) -> str:
        """Mengirim pesan ke provider yang tersedia dengan sistem auto-fallback."""
        result = self.chat(user_input)
        return f"[{result['provider']}]\n{result['reply']}"


def main() -> None:
    bot = MultiProviderChatbot()
    print("=" * 60)
    print(" Chatbot AI Gratis (Auto-Fallback & Tanpa API Key)")
    print(" Ketik '/reset' untuk hapus memori, atau 'exit' untuk keluar")
    print("=" * 60)

    while True:
        try:
            user_text = input("\nAnda: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nKeluar dari chatbot.")
            break

        if not user_text:
            continue
        if user_text.lower() in ("exit", "quit", "keluar"):
            print("Sampai jumpa!")
            break
        if user_text.lower() == "/reset":
            bot.reset_history()
            print("[Info] Riwayat percakapan berhasil di-reset.")
            continue

        try:
            reply = bot.send_message(user_text)
            print(f"\nBot : {reply}")
        except Exception as err:
            print(f"\n[Error]: {err}")


if __name__ == "__main__":
    main()
