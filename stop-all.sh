#!/bin/bash

# Vazifa - Скрипт для остановки всех компонентов проекта

echo "🛑 Остановка экосистемы Vazifa..."
echo "================================="

# Функция для остановки процесса по PID файлу
stop_component() {
    local name=$1
    local pid_file="logs/${name,,}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Остановка $name (PID: $pid)..."
            kill "$pid" 2>/dev/null
            
            # Ждем до 5 секунд для graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 5 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Если процесс все еще работает, принудительно завершаем
            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  Принудительная остановка $name..."
                kill -9 "$pid" 2>/dev/null
            fi
            
            echo "✅ $name остановлен"
        else
            echo "⚠️  $name уже не работает"
        fi
        
        rm "$pid_file"
    else
        echo "⚠️  PID файл для $name не найден"
    fi
}

# Остановка всех компонентов
stop_component "Backend"
stop_component "Frontend"
stop_component "Mobile"

# Дополнительная очистка - поиск и остановка процессов по портам
echo ""
echo "🔍 Проверка оставшихся процессов..."

# Остановка процессов на портах 5001 (backend) и 5173 (frontend)
for port in 5001 5173; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "🛑 Остановка процесса на порту $port (PID: $pid)..."
        kill "$pid" 2>/dev/null
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null
        fi
        echo "✅ Процесс на порту $port остановлен"
    fi
done

# Остановка Expo процессов
expo_pids=$(pgrep -f "expo start" 2>/dev/null)
if [ ! -z "$expo_pids" ]; then
    echo "🛑 Остановка Expo процессов..."
    echo "$expo_pids" | xargs kill 2>/dev/null
    sleep 1
    # Принудительная остановка если нужно
    expo_pids=$(pgrep -f "expo start" 2>/dev/null)
    if [ ! -z "$expo_pids" ]; then
        echo "$expo_pids" | xargs kill -9 2>/dev/null
    fi
    echo "✅ Expo процессы остановлены"
fi

# Остановка Metro bundler процессов
metro_pids=$(pgrep -f "metro" 2>/dev/null)
if [ ! -z "$metro_pids" ]; then
    echo "🛑 Остановка Metro bundler..."
    echo "$metro_pids" | xargs kill 2>/dev/null
    sleep 1
    metro_pids=$(pgrep -f "metro" 2>/dev/null)
    if [ ! -z "$metro_pids" ]; then
        echo "$metro_pids" | xargs kill -9 2>/dev/null
    fi
    echo "✅ Metro bundler остановлен"
fi

# Очистка временных файлов
echo ""
echo "🧹 Очистка временных файлов..."

# Удаление лог файлов (опционально)
if [ "$1" = "--clean-logs" ]; then
    if [ -d "logs" ]; then
        rm -rf logs/*.log
        echo "✅ Лог файлы очищены"
    fi
fi

# Удаление PID файлов
if [ -d "logs" ]; then
    rm -f logs/*.pid
fi

echo ""
echo "✅ Все компоненты остановлены!"
echo "=============================="
echo ""
echo "📋 Статус:"
echo "  - Backend:  остановлен"
echo "  - Frontend: остановлен"
echo "  - Mobile:   остановлен"
echo ""
echo "🚀 Для повторного запуска используйте: ./start-all.sh"
echo "📚 Документация: ./GETTING_STARTED.md"
echo ""

# Показать статус портов
echo "🔍 Проверка портов:"
for port in 5001 5173; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "  - Порт $port: занят"
    else
        echo "  - Порт $port: свободен"
    fi
done

echo ""
echo "👋 До свидания!"
