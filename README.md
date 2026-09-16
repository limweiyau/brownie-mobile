# Brownie

The full Brownie website and interactive demo, without the legacy film experience.

## Run locally

From this directory:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/` for the full site.

The standalone phone conversation is available at `http://localhost:8000/mobile/`.

For hot reload:

```bash
npx live-server . --port=5501
```

## Files

- `index.html` - full landing page, interactive conversation, Tech Stack, charm and quiz.
- `style.css` - full-site styling.
- `chat.css` - styles for the embedded conversation.
- `app.js` - landing-page conversation and interaction flow.
- `tutorial.js` - guided WhatsApp tutorial cues and checkpoints.
- `charm.js` - Three.js otter charm viewer.
- `mobile/` - standalone phone-first conversation and its source files.
- `assets/` - production images, logos, icons and the charm model.

The legacy `film.js` entry point and its film-only assets are intentionally not included.

GSAP, Three.js and related libraries are loaded from jsDelivr in the HTML and renderer files.

## Hermes ThinkPad Hosting

The test copy is hosted at `/home/limweiyau/brownie-mobile` on `hermes-thinkpad`.

Connect to the host:

```bash
ssh limweiyau@hermes-thinkpad
cd /home/limweiyau/brownie-mobile
```

Run the local web server:

```bash
nohup python3 -m http.server 8765 --bind 127.0.0.1 --directory /home/limweiyau/brownie-mobile > /home/limweiyau/brownie-mobile/server.log 2>&1 < /dev/null &
```

Run a temporary public Cloudflare URL:

```bash
nohup /home/limweiyau/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8765 > /home/limweiyau/brownie-mobile/cloudflared.log 2>&1 < /dev/null &
grep -m 1 trycloudflare /home/limweiyau/brownie-mobile/cloudflared.log
```

The Quick Tunnel URL changes when the tunnel restarts and requires no Cloudflare account. Keep both processes running while testing.

To update the host from Windows, copy the site files into `/home/limweiyau/brownie-mobile` with `scp`, then refresh the public URL.
