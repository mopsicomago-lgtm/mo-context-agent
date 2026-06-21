#!/bin/bash

# Mo Context Agent — Quick Start Script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Mo Context Agent — Strategic Advisor   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Check .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env and add your ANTHROPIC_API_KEY${NC}"
        echo -e "${YELLOW}Then run this script again${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

# Check API key
if ! grep -q "ANTHROPIC_API_KEY=sk-ant" .env; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY not configured in .env${NC}"
    echo -e "${YELLOW}Please add your API key from https://console.anthropic.com/account/keys${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env configured${NC}"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""

# Menu
echo "Choose mode:"
echo "  1) CLI (quick query)"
echo "  2) Web (interactive UI on http://localhost:3000)"
echo "  3) Custom port"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        read -p "Enter your question: " question
        node agent.js "$question"
        ;;
    2)
        echo -e "${GREEN}Starting web server...${NC}"
        echo -e "${BLUE}📖 Open http://localhost:3000 in your browser${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        node agent.js --web
        ;;
    3)
        read -p "Enter port (default 3000): " port
        port=${port:-3000}
        echo -e "${GREEN}Starting web server on port ${port}...${NC}"
        echo -e "${BLUE}📖 Open http://localhost:${port} in your browser${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        node agent.js --web $port
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
