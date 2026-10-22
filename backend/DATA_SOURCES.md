# VoyageAI Pro — Real Data Setup Guide

This tells you where to get each dataset, what to download, and where to save it.
After all files are in place, run one command and you're done.

---

## Option A — Fully Automatic (Recommended)

Install dependencies and run the fetch script. It downloads everything automatically.

```bash
cd backend
pip install pandas requests yfinance tqdm
python fetch_market_data.py
```

That's it. If any source is down or rate-limited, the script tells you exactly
what to download manually (Option B).

---

## Option B — Manual Downloads (if Option A fails)

### Step 1 — Baltic Exchange Indices (4 files)

These are the freight rate indices for each vessel class.

| What | URL | Save as |
|---|---|---|
| BHSI (Handysize) | https://www.investing.com/indices/baltic-handysize-index-historical-data | `backend/data/raw/bhsi.csv` |
| BSI (Supramax) | https://www.investing.com/indices/baltic-supramax-index-historical-data | `backend/data/raw/bsi.csv` |
| BPI (Panamax) | https://www.investing.com/indices/baltic-panamax-index-historical-data | `backend/data/raw/bpi.csv` |
| BCI (Capesize) | https://www.investing.com/indices/baltic-capesize-index-historical-data | `backend/data/raw/bci.csv` |

**How to download from Investing.com:**
1. Open the URL → scroll down past the chart
2. Click the **"Download Data"** button (top-right of the data table)
3. Select date range: **01/01/2015 → today**
4. Save the CSV file to `backend/data/raw/` with the filename above

The CSV will have columns: `Date, Price, Open, High, Low, Change%`
The script reads the `Price` column automatically.

---

### Step 2 — Singapore VLSFO Bunker Price

**Option 2A — EIA API (free, takes 2 min to register)**
1. Register at https://www.eia.gov/opendata/ (free, instant)
2. Copy your API key
3. Add to your terminal: `export EIA_API_KEY=your_key_here`
4. Run `python fetch_market_data.py` — it fetches automatically

**Option 2B — Manual download**
1. Go to https://shipandbunker.com/prices/apac/sea/sg-sin-singapore
2. Scroll to "Price History" table → click **"Download"**
3. Save as `backend/data/raw/bunker.csv`

The CSV should have columns: `Date, Price` (USD per metric tonne).

**Option 2C — WTI proxy (automatic fallback)**
If neither above is set up, the script automatically uses WTI crude oil
price × 6.0 as a VLSFO proxy. This is less accurate but acceptable for
training because the model learns relative movements, not absolute levels.

---

### Step 3 — IMF PortWatch (Indian port wait times)

This is fully automatic — the IMF PortWatch API is free with no registration.
The script fetches it in Step 3 automatically.

**If the API is down**, the script falls back to a seasonal baseline
(monsoon + cyclone + port-specific congestion levels). This is fine — the
`wait_*` columns are optional in `market.csv` (auto-filled if missing).

---

## After Downloads

```bash
cd backend
python fetch_market_data.py    # assembles market.csv
python train.py                # trains models on real data (~1 min)
```

Check `backend/artifacts/metrics.json` — it should show `"data_source": "real+partial-synthetic"`.

---

## Expected `market.csv` Schema

```
date           YYYY-MM-DD, weekly Mondays, 2015-01-05 to present
bunker         Singapore VLSFO price (USD/metric tonne) ~300–800
tce_Handysize  Baltic BHSI (USD/day) ~6,000–20,000
tce_Supramax   Baltic BSI  (USD/day) ~8,000–25,000
tce_Panamax    Baltic BPI  (USD/day) ~8,000–30,000
tce_Capesize   Baltic BCI  (USD/day) ~5,000–60,000
wait_Paradip   Vessel anchorage wait at Paradip (days) ~0.5–5.0
wait_Dhamra    (same for Dhamra)
wait_Haldia    (same for Haldia — typically highest ~2–4 days)
wait_Vizag     (same for Vizag)
wait_Gangavaram
wait_Gopalpur
wait_Krishnapatnam
```

All `wait_*` columns and `demand` are optional — the pipeline fills them from
a seasonal synthetic model if absent.
