#!/bin/bash
# GitLab'ga Push Qilish - Avtomatik Script

set -e

echo "🚀 GitLab'ga Push Qilish"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Project directory: $SCRIPT_DIR"
echo ""

# Check if git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ This is not a git repository!${NC}"
    exit 1
fi

echo "📊 Hozirgi remote holati:"
git remote -v
echo ""

# Ask for GitLab username
read -p "GitLab username'ni kiriting (masalan: username): " GITLAB_USERNAME

if [ -z "$GITLAB_USERNAME" ]; then
    echo -e "${RED}❌ GitLab username bo'sh bo'lishi mumkin emas!${NC}"
    exit 1
fi

echo ""
echo "📋 Tanlash:"
echo "1) SSH (git@gitlab.com:...) - SSH key kerak"
echo "2) HTTPS (https://gitlab.com/...) - Personal Access Token kerak"
read -p "Qaysi metodni tanlaysiz? (1 yoki 2): " METHOD

if [ "$METHOD" = "1" ]; then
    GITLAB_URL="git@gitlab.com:${GITLAB_USERNAME}/savdogar.git"
    echo -e "${YELLOW}⚠️  SSH key tekshirilmoqda...${NC}"
    if ssh -T git@gitlab.com 2>&1 | grep -q "Welcome to GitLab"; then
        echo -e "${GREEN}✅ SSH key ishlayapti!${NC}"
    else
        echo -e "${YELLOW}⚠️  SSH key muammosi. SSH key qo'shing:${NC}"
        echo "1. GitLab → Profile → Settings → SSH Keys"
        echo "2. SSH key'ni copy qiling:"
        cat ~/.ssh/id_rsa.pub 2>/dev/null || cat ~/.ssh/id_ed25519.pub 2>/dev/null || echo "SSH key topilmadi!"
        echo ""
        read -p "SSH key qo'shdingizmi? (y/n): " SSH_ADDED
        if [ "$SSH_ADDED" != "y" ] && [ "$SSH_ADDED" != "Y" ]; then
            echo -e "${RED}❌ SSH key qo'shishingiz kerak!${NC}"
            exit 1
        fi
    fi
elif [ "$METHOD" = "2" ]; then
    GITLAB_URL="https://gitlab.com/${GITLAB_USERNAME}/savdogar.git"
    echo -e "${YELLOW}⚠️  HTTPS ishlatiladi. Personal Access Token kerak bo'lishi mumkin.${NC}"
    echo "GitLab → Profile → Settings → Access Tokens → Create token"
else
    echo -e "${RED}❌ Noto'g'ri tanlov!${NC}"
    exit 1
fi

echo ""
read -p "GitHub'ni backup sifatida saqlab qolmoqchimisiz? (y/n): " KEEP_GITHUB

echo ""
echo "🔄 Remote o'zgartirilmoqda..."

if [ "$KEEP_GITHUB" = "y" ] || [ "$KEEP_GITHUB" = "Y" ]; then
    echo "📦 GitHub'ni backup sifatida saqlash..."
    git remote rename origin github 2>/dev/null || echo "⚠️  Remote 'origin' nomi o'zgartirilgan yoki yo'q"
    git remote add origin "$GITLAB_URL"
    echo -e "${GREEN}✅ GitHub 'github' remote sifatida saqlandi${NC}"
else
    echo "🗑️  GitHub remote'ni o'chirish..."
    git remote remove origin
    git remote add origin "$GITLAB_URL"
    echo -e "${GREEN}✅ GitHub remote o'chirildi${NC}"
fi

echo ""
echo "📋 Yangi remote holati:"
git remote -v
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes bor. Commit qilish kerak..."
    echo ""
    git status --short
    echo ""
    read -p "Barcha o'zgarishlarni commit qilmoqchimisiz? (y/n): " COMMIT_CHANGES
    
    if [ "$COMMIT_CHANGES" = "y" ] || [ "$COMMIT_CHANGES" = "Y" ]; then
        git add -A
        git commit -m "Fix: Complete deployment configuration - signup router with business_type support, imports fixed, vercel.json updated. All issues resolved and ready for GitLab deployment."
        echo -e "${GREEN}✅ Commit qilindi!${NC}"
    else
        echo -e "${YELLOW}⚠️  Commit qilinmadi. Keyinroq commit qiling.${NC}"
    fi
else
    echo -e "${GREEN}✅ Hech qanday uncommitted changes yo'q${NC}"
fi

echo ""
read -p "GitLab'ga push qilmoqchimisiz? (y/n): " PUSH_NOW

if [ "$PUSH_NOW" = "y" ] || [ "$PUSH_NOW" = "Y" ]; then
    echo "📤 GitLab'ga push qilinmoqda..."
    echo ""
    
    if git push -u origin master 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Push muvaffaqiyatli!${NC}"
        echo ""
        echo "📊 Latest commit:"
        git log --oneline -1
        echo ""
        echo "🌐 GitLab repository:"
        echo "   https://gitlab.com/${GITLAB_USERNAME}/savdogar"
        echo ""
        echo "✅ Keyingi qadamlar:"
        echo "1. Vercel Dashboard → Settings → Integrations → GitLab"
        echo "2. GitLab integration o'rnating"
        echo "3. Project → Import Git Repository → GitLab → savdogar"
        echo "4. Settings → Root Directory: EMPTY (blank)"
        echo "5. Environment Variables qo'shing"
        echo "6. Deploy qiling!"
    else
        echo ""
        echo -e "${RED}❌ Push xatosi!${NC}"
        echo "Muammo hal qilish:"
        echo "1. SSH key qo'shildimi? (agar SSH ishlatmoqchi bo'lsangiz)"
        echo "2. Personal Access Token to'g'rimi? (agar HTTPS ishlatmoqchi bo'lsangiz)"
        echo "3. GitLab'da repository yaratildimi?"
        echo "4. Repository URL to'g'rimi?"
        exit 1
    fi
else
    echo ""
    echo "📝 Keyinroq push qilish uchun:"
    echo "   git push -u origin master"
fi

echo ""
echo "✅ Yakunlandi!"
