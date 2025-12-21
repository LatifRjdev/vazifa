#!/bin/bash
echo "=========================================="
echo "🔧 Исправление всех VITE_API_URL"
echo "=========================================="

ssh ubuntu@193.111.11.98 -p 3022 << 'ENDSSH'

cd /var/www/vazifa/frontend/app

echo "1️⃣ Замена в sign-in.tsx (Google):"
sed -i "s|\${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api-v1/auth/google|/api-v1/auth/google|g" routes/auth/sign-in.tsx

echo "2️⃣ Замена в sign-up.tsx:"
sed -i 's|\${import.meta.env.VITE_API_URL}/api-v1/auth/register-phone|/api-v1/auth/register-phone|g' routes/auth/sign-up.tsx

echo "3️⃣ Замена в verify.\$token.tsx:"
sed -i 's|\${import.meta.env.VITE_API_URL}/api-v1/auth/verify-phone-link|/api-v1/auth/verify-phone-link|g' routes/verify.\$token.tsx

echo "4️⃣ Замена в sms-verification.tsx:"
sed -i 's|\${import.meta.env.VITE_API_URL}/api-v1/auth/verify-phone|/api-v1/auth/verify-phone|g' components/auth/sms-verification.tsx
sed -i 's|\${import.meta.env.VITE_API_URL}/api-v1/auth/resend-code|/api-v1/auth/resend-code|g' components/auth/sms-verification.tsx

echo "5️⃣ Замена в task-attachments.tsx:"
sed -i 's|\${import.meta.env.VITE_API_URL}/upload|/uploads|g' components/tasks/task-attachments.tsx

echo "6️⃣ Замена в response-section.tsx:"
sed -i "s|\${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/upload|/uploads|g" components/tasks/response-section.tsx

echo "7️⃣ Замена в create-task-dialog.tsx:"
sed -i "s|const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';|const apiUrl = '';|g" components/tasks/create-task-dialog.tsx

echo "8️⃣ Замена в comment-section.tsx:"
sed -i "s|\${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/upload|/uploads|g" components/tasks/comment-section.tsx

echo "9️⃣ Замена в tech-admin.tsx:"
sed -i 's|\${import.meta.env.VITE_API_URL}/tech-admin/dashboard/stats|/api-v1/tech-admin/dashboard/stats|g' routes/dashboard/tech-admin.tsx

echo "🔟 Замена в callback.tsx:"
sed -i "s|\${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/users/me|/api-v1/users/me|g" routes/auth/callback.tsx

echo ""
echo "✅ Все файлы исправлены!"
echo ""
echo "📦 Пересборка frontend:"
cd /var/www/vazifa/frontend
npm run build

echo ""
echo "🔄 Перезапуск:"
pm2 restart vazifa-frontend

echo ""
echo "⏳ Ожидание 5 секунд..."
sleep 5

echo ""
echo "📊 Статус:"
pm2 list

ENDSSH

echo "=========================================="
echo "✅ Готово!"
echo "=========================================="
