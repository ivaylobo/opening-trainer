# Opening Trainer

A chess opening trainer application for practicing chess openings.

## Setup

No installation required. The project uses CDN links for all libraries.

## Running the Application

Start a local HTTP server to serve the files:

```bash
npx http-server -p 8000
```

Then open your browser and navigate to:
- `http://localhost:8000`
- or `http://127.0.0.1:8000`

## Project Structure

- `index.html` - Main application file
- `debuts.json` - Chess openings database (Caro-Kann, Scandinavian, etc.)
- `assets/chesspieces/` - Chess piece images

## How to Add New Openings

Edit `debuts.json` to add new chess openings. Example format:

```json
{
  "Opening Name": [
    "e4", "c5",
    "Nf3", "d6",
    "d4", "cxd4"
  ]
}
```

Each opening is a sequence of moves in standard algebraic notation.
