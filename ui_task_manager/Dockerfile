# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install serve globally
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S reactgroup && \
    adduser -S reactuser -u 1001 -G reactgroup

# Set working directory  
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Change ownership to non-root user
RUN chown -R reactuser:reactgroup /app
USER reactuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the React application
CMD ["serve", "-s", "build", "-l", "3000"]