# 📘 WildWalk: Setup Guide (Windows, simple)

Total time: lagbhag 30–40 min (pehli baar). Ek baar setup, fir roz sirf `start_all.bat`.

---

## Step 1: Ye 3 cheezein install karo (ek baar)

| Kya | Kahan se | Check karo |
|---|---|---|
| **Python 3.11+** | python.org/downloads → install karte waqt **"Add python.exe to PATH" tick karo** | `python --version` |
| **Ollama** | ollama.com → Download → install | taskbar mein llama icon |
| **Temporal CLI** | docs.temporal.io/cli → Windows instructions | `temporal --version` |

---

## Step 2: Keys lo (ek baar)

Har site par account banao, phir key copy karke rakh lo.

1. **SerpApi:** serpapi.com → signup → Dashboard → **API Key**. → `SERPAPI_KEY`
2. **ElevenLabs:** elevenlabs.io → signup → profile → **API Keys** → Create. → `ELEVEN_API_KEY`
3. **Tiger Data:** tigerdata.com → signup → **Create service** (free) → connection string (`postgres://...`). → `TIGER_URL`
4. **MongoDB Atlas:** mongodb.com/atlas → signup → **free M0 cluster**.
   - Database Access → user banao (username + password, sirf letters aur numbers).
   - Network Access → **Allow access from anywhere**.
   - Connect → Drivers → connection string copy karo, `<password>` ki jagah apna password daalo. → `MONGO_URI`
   - Atlas → **Search → Create Index → JSON Editor**. Database `wildwalk`, collection `journal`, index name `journal_vec`:
   ```json
   {"fields":[
    {"type":"vector","path":"emb","numDimensions":768,"similarity":"cosine"},
    {"type":"filter","path":"user"}]}
   ```
5. **Sentry (optional):** sentry.io → Python project → DSN. Na bharo to bhi chalega. → `SENTRY_DSN`
6. **TabPFN (pehli baar):** koi key pehle se nahi chahiye. Pehli baar `start_all.bat` chalane par browser khulega. Wahan **license accept** karo (ux.priorlabs.ai/account/licenses), login karo, aur terminal mein key paste karo. Ye sirf ek baar hota hai.

> ⚠️ Keys kisi ko mat dikhana, screenshot mein bhi nahi. `.env` file GitHub par kabhi push mat karna.

---

## Step 3: Setup (sirf pehli baar)

1. Project folder kholo.
2. **`setup.bat` par double-click** karo.
3. Ye automatically:
   - Python environment banata hai
   - Libraries install karta hai
   - `.env` file banata hai
   - Gemma model download karta hai (2–3 min)
4. Jab Notepad khule, to keys bharo, save karo aur band karo.

---

## Step 4: Roz chalane ke liye

1. **`start_all.bat` par double-click** karo.
2. 3 black windows khulengi. **Band mat karna.**
3. Pehli baar Worker window mein TabPFN download hoga (5–10 min). Wait karo jab tak `Worker started` na dikhe.
4. Browser mein apne aap `http://localhost:8000` khul jayega.

**Band karna ho to:** teeno black windows band kar do.

---

## Step 5: Website use karo

- **Plan:** city likho → "Plan my walk". Score, guide aur audio aayega.
- **Pocket mode:** "Pocket mode" dabao → time chuno → "Start walk" → phone pocket mein.
- **Journal:** pichli walks dekho, CSV export karo.
- **Learn:** nature fact likho, Save karo.

---

## 🛠 Problem aaye to

| Problem | Solution |
|---|---|
| `python` nahi mila | Python install karte waqt PATH tick karna bhool gaye. Python dobara install karo. |
| `temporal` nahi mila | Temporal CLI install karo (Step 1). |
| Website blank ya "Cannot reach API" | `start_all.bat` chalaya? 1 min wait karo, fir refresh. |
| Guide ki jagah simple guide aayi | Backend chal nahi raha. Worker window check karo. |
| Worker mein error | Us window ka text copy karo (keys hata kar) aur bhejo. |
| `ollama` error | Ollama app kholo (taskbar icon). |
| Mongo error | Atlas mein Network Access "Allow from anywhere" hai? Password mein `@` nahi hona chahiye. |

---

## 🧾 Commands (agar setup.bat na chale)

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
ollama pull gemma3:1b
ollama pull nomic-embed-text
```