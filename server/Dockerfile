# ==============================================================================
# SkillTrack Backend — Production Dockerfile
# Multi-stage lightweight Alpine container running as non-root node user.
# ==============================================================================

FROM node:20-alpine AS base

# Install dumb-init or dependencies if needed for signal handling
RUN apk add --no-cache dumb-init

# Set application directory
WORKDIR /usr/src/app

# Set default production environment
ENV NODE_ENV=production

# Copy package manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy application source code
COPY src ./src

# Set ownership to unprivileged node user
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose default HTTP port
EXPOSE 5000

# Container healthcheck using liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle PID 1 signal forwarding (SIGTERM / SIGINT)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start server using production command
CMD ["node", "src/server.js"]
