const readline = require("readline");

// =====================================================================
// KONFIGURASI PROVIDER GRATIS (AUTO-FALLBACK / ANTI-LIMIT)
// =====================================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""; // https://openrouter.ai/settings/keys
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";             // https://console.groq.com/keys

const PROVIDERS = [
  {
    name: "OpenRouter (Venice Uncensored Free)",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    apiKey: OPENROUTER_API_KEY,
    requiresKey: true,
    format: "openai",
  },
  {
    name: "Groq (Llama 3.3 70B Free)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    apiKey: GROQ_API_KEY,
    requiresKey: true,
    format: "openai",
  },
  {
    name: "Pollinations AI (No API Key / Unlimited Free)",
    url: "https://text.pollinations.ai/openai",
    model: "openai-fast",
    apiKey: "",
    requiresKey: false,
    format: "openai",
  },
  {
    name: "Pollinations AI Fast GET (No API Key Backup)",
    url: "https://text.pollinations.ai",
    model: "openai-fast",
    apiKey: "",
    requiresKey: false,
    format: "pollinations_get",
  },
];

const DEFAULT_SYSTEM_PROMPT =
  "Nama kamu adalah Cantarella - Ai. Kamu adalah asisten AI yang cerdas, ramah, dan membantu. " +
  "Kamu diciptakan dan dikembangkan oleh FallZx Infinity (Creator: FallZx Infinity). " +
  "Jika ada yang bertanya siapa namamu atau siapa pembuatmu/penciptamu, jawab dengan tegas bahwa namamu adalah Cantarella - Ai dan penciptamu adalah FallZx Infinity. " +
  "Gunakan bahasa Indonesia yang natural dan sopan.";

class MultiProviderChatbot {
  constructor(systemPrompt = DEFAULT_SYSTEM_PROMPT) {
    this.systemPrompt = systemPrompt;
    this.messages = [{ role: "system", content: this.systemPrompt }];
  }

  resetHistory() {
    this.messages = [{ role: "system", content: this.systemPrompt }];
  }

  async chat(userInput) {
    this.messages.push({ role: "user", content: userInput });
    const errors = [];

    for (const provider of PROVIDERS) {
      if (provider.requiresKey && !provider.apiKey) {
        continue;
      }

      try {
        let reply = null;

        if (provider.format === "pollinations_get") {
          const encoded = encodeURIComponent(userInput);
          const sysEncoded = encodeURIComponent(this.systemPrompt);
          const res = await fetch(`${provider.url}/${encoded}?system=${sysEncoded}`, {
            method: "GET",
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(30000),
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          reply = (await res.text()).trim();
        } else {
          const headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
          };
          if (provider.apiKey) {
            headers["Authorization"] = `Bearer ${provider.apiKey}`;
          }

          const payload = {
            model: provider.model,
            messages: this.messages,
          };

          const res = await fetch(provider.url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(40000),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
          }

          const data = await res.json();
          reply = data?.choices?.[0]?.message?.content?.trim() || null;
        }

        if (reply) {
          this.messages.push({ role: "assistant", content: reply });
          return {
            reply,
            provider: provider.name,
            model: provider.model,
          };
        } else {
          errors.push(`${provider.name}: Respons kosong`);
        }
      } catch (err) {
        errors.push(`${provider.name}: ${err.message}`);
      }
    }

    this.messages.pop();
    throw new Error(
      "Semua provider gagal dihubungi:\n- " + errors.join("\n- ")
    );
  }

  async sendMessage(userInput) {
    const result = await this.chat(userInput);
    return `[${result.provider}]\n${result.reply}`;
  }
}

// Mode CLI interaktif jika dijalankan langsung: `node chatbot.js`
if (require.main === module) {
  const bot = new MultiProviderChatbot();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("============================================================");
  console.log(" Chatbot AI Node.js (Auto-Fallback & Tanpa API Key)");
  console.log(" Ketik '/reset' untuk hapus memori, atau 'exit' untuk keluar");
  console.log("============================================================");

  const promptUser = () => {
    rl.question("\nAnda: ", async (answer) => {
      const text = answer.trim();
      if (!text) return promptUser();
      if (["exit", "quit", "keluar"].includes(text.toLowerCase())) {
        console.log("Sampai jumpa!");
        rl.close();
        return;
      }
      if (text.toLowerCase() === "/reset") {
        bot.resetHistory();
        console.log("[Info] Riwayat percakapan berhasil di-reset.");
        return promptUser();
      }

      try {
        const reply = await bot.sendMessage(text);
        console.log(`\nBot : ${reply}`);
      } catch (err) {
        console.error(`\n[Error]: ${err.message}`);
      }
      promptUser();
    });
  };

  promptUser();
}

module.exports = { MultiProviderChatbot, PROVIDERS };
