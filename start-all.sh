#!/bin/bash

# Vazifa - Скрипт для запуска всех компонентов проекта
# Этот скрипт запускает Backend, Frontend и Mobile приложение одновременно

echo "🚀 Запуск экосистемы Vazifa..."
echo "=================================="

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Пожалуйста, установите Node.js версии 16 или выше."
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Пожалуйста, установите npm."
    exit 1
fi

# Проверка наличия expo
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI не найден. Устанавливаем..."
    npm install -g @expo/cli
fi

# Функция для проверки и установки зависимостей
install_dependencies() {
    local dir=$1
    local name=$2
    
    echo "📦 Проверка зависимостей для $name..."
    
    if [ ! -d "$dir/node_modules" ]; then
        echo "🔧 Установка зависимостей для $name..."
        cd "$dir"
        npm install
        cd - > /dev/null
    else
        echo "✅ Зависимости для $name уже установлены"
    fi
}

# Проверка структуры проекта
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "mobile/VazifaMobile" ]; then
    echo "❌ Неправильная структура проекта. Убедитесь, что вы находитесь в корневой папке проекта Vazifa."
    exit 1
fi

# Установка зависимостей для всех компонентов
install_dependencies "backend" "Backend"
install_dependencies "frontend" "Frontend"
install_dependencies "mobile/VazifaMobile" "Mobile"

# Проверка файлов окружения
echo "🔧 Проверка конфигурации..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Файл backend/.env не найден. Создаем из примера..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "📝 Пожалуйста, отредактируйте backend/.env с вашими настройками"
    else
        echo "❌ Файл backend/.env.example не найден"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Файл frontend/.env не найден. Создаем из примера..."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "📝 Пожалуйста, отредактируйте frontend/.env с вашими настройками"
    else
        echo "❌ Файл frontend/.env.example не найден"
    fi
fi

# Функция для запуска компонента в фоне
start_component() {
    local dir=$1
    local name=$2
    local command=$3
    local port=$4
    
    echo "🚀 Запуск $name..."
    
    cd "$dir"
    
    # Создаем лог файл
    local log_file="../logs/${name,,}.log"
    mkdir -p ../logs
    
    # Запускаем в фоне и сохраняем PID
    $command > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "../logs/${name,,}.pid"
    
    echo "✅ $name запущен (PID: $pid)"
    if [ ! -z "$port" ]; then
        echo "🌐 $name доступен на: http://localhost:$port"
    fi
    
    cd - > /dev/null
}

# Создаем папку для логов
mkdir -p logs

echo ""
echo "🚀 Запуск компонентов..."
echo "========================"

# Запуск Backend
start_component "backend" "Backend" "npm run dev" "5001"

# Ждем немного, чтобы backend успел запуститься
sleep 3

# Запуск Frontend
start_component "frontend" "Frontend" "npm run dev" "5173"

# Запуск Mobile
echo "📱 Запуск Mobile приложения..."
cd mobile/VazifaMobile
expo start > ../../logs/mobile.log 2>&1 &
mobile_pid=$!
echo $mobile_pid > ../../logs/mobile.pid
echo "✅ Mobile приложение запущено (PID: $mobile_pid)"
echo "📱 Отсканируйте QR-код в Expo Go для тестирования"
cd - > /dev/null

echo ""
echo "🎉 Все компоненты запущены!"
echo "=========================="
echo "📊 Backend API:      http://localhost:5001"
echo "🌐 Web приложение:   http://localhost:5173"
echo "📱 Mobile:           Отсканируйте QR-код в терминале"
echo ""
echo "📋 Управление:"
echo "  - Просмотр логов:  tail -f logs/[backend|frontend|mobile].log"
echo "  - Остановка:       ./stop-all.sh"
echo ""
echo "🔍 Проверка статуса:"
echo "  - Backend:  curl http://localhost:5001/api-v1/health"
echo "  - Frontend: открыть http://localhost:5173 в браузере"
echo ""
echo "📚 Документация:"
echo "  - Быстрый старт:   ./GETTING_STARTED.md"
echo "  - README:          ./README.md"
echo ""

# Функция для graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Остановка всех компонентов..."
    
    if [ -f "logs/backend.pid" ]; then
        kill $(cat logs/backend.pid) 2>/dev/null
        rm logs/backend.pid
        echo "✅ Backend остановлен"
    fi
    
    if [ -f "logs/frontend.pid" ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null
        rm logs/frontend.pid
        echo "✅ Frontend остановлен"
    fi
    
    if [ -f "logs/mobile.pid" ]; then
        kill $(cat logs/mobile.pid) 2>/dev/null
        rm logs/mobile.pid
        echo "✅ Mobile остановлен"
    fi
    
    echo "👋 Все компоненты остановлены. До свидания!"
    exit 0
}

# Обработка сигналов для graceful shutdown
trap cleanup SIGINT SIGTERM

echo "💡 Нажмите Ctrl+C для остановки всех компонентов"
echo ""

# Ожидание сигнала завершения
while true; do
    sleep 1
done
