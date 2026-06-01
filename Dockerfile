FROM node:20-alpine AS base
WORKDIR /app

# ─── Edge Function ───────────────────────────────
FROM base AS edge-functions
COPY supabase/edge-functions ./edge-functions
RUN echo "Edge functions ready"
