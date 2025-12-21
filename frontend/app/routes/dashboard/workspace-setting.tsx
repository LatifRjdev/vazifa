import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-context";
import { Settings, User as UserIcon, Bell, Shield, Palette, Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vazifa | Настройки системы" },
    { name: "description", content: "Настройки системы в Vazifa!" },
  ];
}

const WorkspaceSetting = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    systemName: "Vazifa Task Management",
    systemDescription: "Система управления задачами",
    maxTasksPerUser: 100,
    defaultTaskPriority: "Medium",
    emailNotifications: true,
    taskReminders: true,
  });

  const handleSaveSettings = () => {
    // В реальном приложении здесь был бы API вызов
    toast.success("Настройки сохранены успешно!");
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Настройки системы
        </h2>
        <p className="text-muted-foreground">
          Управляйте настройками системы управления задачами
        </p>
      </div>

      {/* Информация о системе */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Информация о системе
          </CardTitle>
          <CardDescription>
            Основная информация о системе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Название системы</Label>
              <div className="text-sm font-medium">{settings.systemName}</div>
            </div>
            <div className="space-y-2">
              <Label>Версия</Label>
              <div className="text-sm font-medium">1.0.0</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <div className="text-sm text-muted-foreground">{settings.systemDescription}</div>
          </div>
        </CardContent>
      </Card>

      {/* Настройки пользователя */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Профиль пользователя
          </CardTitle>
          <CardDescription>
            Информация о текущем пользователе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input value={user?.name || ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} readOnly className="bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Роль</Label>
            <Input
              value={
                user?.role === "admin" ? "Администратор" :
                user?.role === "manager" ? "Менеджер" : "Участник"
              }
              readOnly
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Настройки задач (только для админов) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Настройки задач
            </CardTitle>
            <CardDescription>
              Системные настройки для управления задачами (только для администраторов)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTasks">Максимум задач на пользователя</Label>
                <Input
                  id="maxTasks"
                  type="number"
                  value={settings.maxTasksPerUser}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maxTasksPerUser: parseInt(e.target.value) || 100
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultPriority">Приоритет по умолчанию</Label>
                <select
                  id="defaultPriority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={settings.defaultTaskPriority}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultTaskPriority: e.target.value
                  }))}
                >
                  <option value="Low">Низкий</option>
                  <option value="Medium">Средний</option>
                  <option value="High">Высокий</option>
                </select>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings}>
                Сохранить настройки
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Уведомления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления
          </CardTitle>
          <CardDescription>
            Настройки уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Настройки уведомлений будут добавлены в следующих обновлениях.
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Email уведомления</Label>
              <div className="text-sm text-muted-foreground">Скоро</div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Напоминания о задачах</Label>
              <div className="text-sm text-muted-foreground">Скоро</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Внешний вид */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Внешний вид
          </CardTitle>
          <CardDescription>
            Настройки темы и внешнего вида
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Настройки темы будут добавлены в следующих обновлениях.
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Темная тема</Label>
              <div className="text-sm text-muted-foreground">Скоро</div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Цветовая схема</Label>
              <div className="text-sm text-muted-foreground">Скоро</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceSetting;
