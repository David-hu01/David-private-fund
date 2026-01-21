# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a private fund management dashboard that automatically fetches portfolio holdings from Interactive Brokers (IBKR) and displays them on a website. The system has two main components:

1. **Data Update Script** (`update_portfolio.py`): Connects to IBKR API to fetch real-time holdings and generates JSON data
2. **Website Dashboard** (`index.html`): Visualizes portfolio data with interactive charts using Chart.js

The project uses a hybrid data fetching strategy:
- **IBKR API** for precious metals (XAUUSD, XAGUSD) using CMDTY contract type with SMART exchange
- **yfinance API** for stock prices (NVDA, ALAB, etc.)
- Local file-based architecture: scripts stay local (in `.gitignore`), only `portfolio_data.json` and website files go to GitHub

## Common Commands

### Update Portfolio Data
```bash
# Using uv (recommended - fastest)
make run
# or
uv run python update_portfolio.py

# Using virtual environment directly
source .venv/bin/activate  # macOS/Linux
python update_portfolio.py
```

### Dependency Management
```bash
# Install dependencies
make install
# or
uv sync

# Add new dependency
uv add <package-name>

# Update all dependencies
make update
# or
uv lock --upgrade && uv sync
```

### Code Quality
```bash
# Check code
make lint
# or
uv run ruff check .

# Format code
make format
# or
uv run ruff format .
```

### Environment Setup
```bash
# Initial setup
make install
```

## Architecture

### Data Flow
1. `update_portfolio.py` runs → connects to IBKR API
2. Fetches account summary (NetLiquidation, TotalCashValue) and positions
3. Classifies positions:
   - Precious metals (XAUUSD, XAGUSD) → IBKR API with CMDTY/SMART
   - Stocks → yfinance API
   - Cash positions → use avg_cost directly
4. Generates `portfolio_data.json` with colors and percentages
5. Website loads JSON via fetch() and renders Chart.js doughnut chart

### IBKR API Connection

**Important Configuration** (in `update_portfolio.py` line 328):
```python
HOST = '127.0.0.1'
PORT = 7496  # TWS paper trading: 7497, live: 7496
            # IB Gateway paper: 4007, live: 4008
CLIENT_ID = 1
```

**Two-Step Price Fetching Pattern:**
The script uses an asynchronous pattern because market data arrives after callbacks complete:
1. `position()` callback stores contracts in `self.portfolio_contracts`
2. `positionEnd()` triggers price requests:
   - For metals: `reqMktData()` for IBKR (async via `tickPrice` callback)
   - For stocks: synchronous yfinance calls
3. Main thread waits for `pending_market_data` to reach 0
4. Processes received prices and generates JSON

**Critical:** IBKR market data is async. The `tickPrice()` callback decrements `pending_market_data`, and the main loop waits for this to complete before timing out (20 seconds for metals).

### Color Scheme Management

Colors are dynamically assigned in `update_portfolio.py:239-271`:
- NVDA: Cyan `rgba(6, 182, 212, 0.8)`
- Gold: Golden `rgba(251, 191, 36, 0.8)`
- Silver: Silver-blue `rgba(148, 163, 184, 0.8)`
- ALAB: Pink-purple `rgba(236, 72, 153, 0.8)`
- Cash: Green `rgba(34, 197, 94, 0.8)`
- Others: Rainbow color cycle

**Color consistency:** The same RGBA values are embedded in JSON (`color` with 0.8 alpha, `border_color` with 1.0 alpha), and website reads these directly (index.html:478-479). No hardcoded colors in website.

### Website Architecture

**Dynamic Data Loading** (index.html:218-247):
- Uses `fetch('portfolio_data.json')` to load data
- Maps JSON arrays to Chart.js dataset
- Formats timestamp for display
- Falls back to default data if JSON unavailable

**Chart.js Configuration** (index.html:426-467):
- Doughnut chart for portfolio distribution
- Legend at bottom with compact sizing (boxWidth: 12px, padding: 12px)
- Tooltip shows percentage on hover
- Responsive sizing with `sm:max-w-lg` container

**Portfolio Cards** (index.html:470-497):
- Dynamically generated from `portfolioData`
- Background color uses 0.15 alpha (from JSON color with 0.8)
- Hover animation: `translateY(-8px) scale(1.05)` with shadow
- Cards colors match pie chart exactly (read from JSON)

### Git Workflow

**Local-First Development:**
- Python scripts (`update_portfolio.py`, `init.sh`, etc.) stay local
- Scripts are excluded from Git via `.gitignore` (`.backup/`, `*.py`, etc.)
- Only website files and `portfolio_data.json` are committed to GitHub
- Local backups are created in `.backup/` with timestamps: `update_portfolio_v{version}_{timestamp}.py`

**Deployment:**
```bash
# After updating portfolio data
git add portfolio_data.json
git commit -m "更新持仓数据 (YYYY-MM-DD)"
git push
```

## Important Implementation Details

### Threading and Locks
The `PortfolioApp` class uses `threading.Lock()` to protect shared state:
- `self.portfolio_data` - final processed portfolio
- `self.market_data_received` - async price data dict
- `self.pending_market_data` - counter for pending requests

All callbacks (`accountSummary`, `tickPrice`, `position`) acquire lock before modifying state.

### Contract Creation for Metals
```python
contract = Contract()
contract.symbol = "XAUUSD"  # or "XAGUSD"
contract.secType = "CMDTY"  # Commodities
contract.exchange = "SMART"
contract.currency = "USD"
```

### Percentage Calculation
Percentages are calculated as `market_value / total_assets * 100` where:
- `total_assets = total_market_value + cash_value`
- Uses market value, NOT cost basis
- Sorted by percentage descending in JSON

### Error Handling
- Error codes 2104, 2106 are ignored (market data connection messages)
- Error 502 triggers helpful IBKR connection troubleshooting
- Market data timeout: uses avg_cost as fallback
- yfinance failures: falls back to avg_cost with warning

## File Structure Notes

- `update_portfolio.py` - Main IBKR integration script (LOCAL ONLY)
- `index.html` - Website dashboard with Chart.js visualization
- `portfolio_data.json` - Generated data file (committed to Git)
- `.gitignore` - Excludes Python scripts, `.backup/`, `uv.lock`
- `Makefile` - Convenience commands for common operations
- `README_IBKR.md` - Detailed IBKR setup instructions in Chinese
- `.backup/` - Timestamped backups of script versions

## Troubleshooting

**Market Data Timeout:** If metals prices timeout, script falls back to avg_cost. Increase timeout in line 359 (currently 20 seconds).

**Chart Legend Wrapping:** If legend items wrap to multiple lines, adjust container width (line 109: `sm:max-w-lg`) or reduce legend items (line 447: boxWidth, padding).

**IBKR Connection Failures:** Ensure TWS/Gateway is running with API enabled on correct port. Check firewall settings.

**Browser Caching:** Force refresh (Ctrl+Shift+R) to see updated portfolio_data.json.
