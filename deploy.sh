#!/usr/bin/env bash
set -e

# ==============================================================
# TOPBOX SUPPORT OS — Production Server Deployment Script
# ==============================================================

echo "🚀 [1/4] Checking environment..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "ℹ️ Please configure your .env file with production tokens."
fi

echo "📦 [2/4] Pulling latest git changes..."
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    git pull origin main || echo "⚠️ Git pull skipped or working tree has uncommitted changes."
fi

echo "🐳 [3/4] Building and starting Docker containers..."
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo "🔍 [4/4] Verifying health check..."
sleep 4
if command -v curl &> /dev/null; then
    curl -s http://127.0.0.1:8080/health || echo "⚠️ Server starting up..."
fi

echo ""
echo "✅ TOPBOX SUPPORT OS successfully deployed and running!"
echo "🌐 Web panel: http://your-server-ip:8080"
echo "📜 View logs: docker compose logs -f support-os"
