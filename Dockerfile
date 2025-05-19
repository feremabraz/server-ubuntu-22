# Ubuntu 22.04 base image
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && \
    apt-get install -y sudo openssh-server ufw curl gnupg2 && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js v22.x via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Copy the entire project (including source and package files)
WORKDIR /app
COPY . .

# Install dependencies and build the executable
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    pnpm install && \
    pnpm build && \
    chmod +x ubuntu-hardening-tool

# Optionally expose SSH port for testing
EXPOSE 22

# Default command shows help
CMD ["./ubuntu-hardening-tool", "--help"]
