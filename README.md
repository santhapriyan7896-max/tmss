# TMSS Educational Trust – website

Website for TMSS Educational Trust, Karur: college admission and career guidance.

Plain HTML, CSS and JavaScript. No build step; open `index.html` or serve the folder with any static host (Netlify, Cloudflare Pages, GitHub Pages).

## Structure
- `index.html`: the page (English text lives here)
- `css/styles.css`: all styles, including responsive and Tamil typography
- `js/i18n.js`: Tamil translations; edit wording here
- `js/main.js`: language switch, cutoff calculator, enquiry forms → WhatsApp, animations
- `PLACEHOLDERS.md`: what must be replaced before going live

## Language
The EN / தமிழ் toggle in the header switches the whole site. Add `?lang=ta` to the URL to open it in Tamil.

## Preview locally
```
python -m http.server 5500
```
Then open http://localhost:5500
