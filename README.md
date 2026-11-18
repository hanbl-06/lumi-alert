# Lumi Alert — website

A two-page marketing site for **Lumi Alert**, a lamp-failure detection business:
a sensor that retrofits into existing light fixtures so cities, campuses, retail
property and industrial sites know the moment a light goes dark.

Static HTML/CSS/JS. No build step, no dependencies, no API keys — drop it on
GitHub Pages and it runs.

---

## 1. Add your AI-generated hero video  ← do this first

The landing page already has an autoplaying, looping, muted video element wired
up. It is waiting for one file:

```
hero.mp4
```

Save your clip with exactly that name in this folder — the same folder as
`index.html` — and it appears automatically. Until then, an animated canvas "night grid" plays in its place, so
the hero is never blank.

**Prompt to paste into Gemini / Veo (or any AI video tool):**

> Cinematic slow aerial drone shot at night, flying low over a quiet city street
> grid lit by warm amber streetlights. One streetlight in the middle of the frame
> flickers and goes completely dark. A thin glowing amber ring pulses outward from
> that dark lamp, like a signal being sent. Moody, luxurious, deep navy-black sky,
> shallow depth of field, no text, no people, no cars. 5 seconds, seamless loop.

Keep it around **5 seconds** and under ~8 MB so the page stays fast. If your tool
exports `.mov` or `.webm`, either rename/convert to `.mp4`, or save it as
`hero.webm` — the page already lists both sources.

---

## 2. Put it on GitHub Pages

1. Go to <https://github.com/new>. Name the repository **`lumi-alert`**, set it to
   **Public**, and click **Create repository**.
2. On the new repo page click **uploading an existing file**.
3. Open the `lumi-alert` folder on your Mac, select **every file inside it** and
   drag them into the browser window. Wait for all of them to finish uploading,
   then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment → Source* choose
   **Deploy from a branch**, set the branch to **`main`** and the folder to
   **`/ (root)`**, then click **Save**.
5. Wait 1–2 minutes and refresh. GitHub shows your live URL at the top:
   `https://<your-username>.github.io/lumi-alert/`

That URL is what you submit.

---

## 3. What's in here

| File | What it does |
| --- | --- |
| `index.html` | Landing page: hero video, problem, how it works, savings calculator, Live Grid simulator, segments, footer with the X-factor note |
| `partners.html` | Partner program: why we sell through partners, the three tracks, the fit-score matcher, onboarding timeline, FAQ |
| `lumi.css` | The whole design system — colors, type, components, responsive rules |
| `app.js` | Nav, scroll reveals, counters, hero ambience canvas, video autoplay handling |
| `calculator.js` | The savings model (see below) |
| `simulator.js` | The Live Grid simulator — the X-factor feature |
| `matcher.js` | The partner fit-score engine |
| `chat.js` | "Beacon", the chatbot — injected on both pages |
| `favicon.svg`, `hero-poster.svg` | Brand icon and the hero's static fallback frame |

### Lab 5 checklist

- **Working URL** — step 2 above.
- **Video autoplays and loops** — `<video autoplay loop muted playsinline>` on the landing page.
- **Button to a second page** — "Find your partner match →" in the hero (and in the nav, and the closing CTA) opens `partners.html`, which is a full page of original content.
- **Chatbot on both pages** — `chat.js` is loaded by `index.html` and `partners.html`.
- **X-factor** — the Live Grid simulator, described in under 50 words at the bottom of the landing page.

---

## 4. How the savings calculator works

Four cost buckets, all editable under *Adjust the assumptions*:

| Bucket | Model |
| --- | --- |
| Detection labor | patrol hours × (labor rate + service vehicle rate); 92% of it goes away |
| Truck rolls | 1.45–1.6 visits per failure today vs ~0.8 when failures arrive pre-diagnosed and batched into one route |
| Wasted energy | a failing fixture keeps drawing ~45% of rated power for the weeks nobody notices |
| Dispatch handling | complaint intake and triage minutes per failure, down to ~4 minutes for an auto-generated work order |

Failure rates: 4%/yr for LED, 8% mixed fleet, 14% HID/halide. Lumi Alert pricing
is volume-tiered ($9 → $5.50 per fixture per year) and the tier updates as you move
the fixture slider.

The model is deliberately honest: at small fixture counts with no patrol program it
will tell you the subscription costs more than it saves, rather than hiding it.

## 5. Editing it later

Every file sits in one folder, so there are no paths to keep track of. Everything is plain HTML — open the file, change the words, save. The chatbot's
answers live in the `KB` array at the top of `chat.js`: each entry has `k`
(keywords that trigger it), `a` (the answer) and `q` (the suggested follow-up
buttons). Add an entry and the bot can answer a new question.

Brand colors are CSS variables at the top of `lumi.css` — change `--brass-500`
and the whole site re-themes.
