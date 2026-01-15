import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/providers/language-context";
import {
  Settings,
  RefreshCw,
  Save,
  MessageSquare,
  Mail,
  Bell,
  Shield,
  Wrench,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib";

interface SystemSettings {
  sms: {
    enabled: boolean;
    retryAttempts: number;
    retryDelayMs: number;
    dailyLimit: number;
  };
  email: {
    enabled: boolean;
    retryAttempts: number;
    retryDelayMs: number;
  };
  notifications: {
    taskAssignment: boolean;
    taskCompletion: boolean;
    taskReminder: boolean;
    passwordReset: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    sessionTimeoutMinutes: number;
    requireTwoFactor: boolean;
  };
}

interface EnvironmentSettings {
  environment: string;
  smtpHost: string;
  smppHost: string;
  redisHost: string;
  mongoUri: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sms");

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const response = await api.get("/tech-admin/settings");
      return response.data.data as {
        settings: SystemSettings;
        environment: EnvironmentSettings;
      };
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async ({ category, settings }: { category: string; settings: Record<string, unknown> }) => {
      const response = await api.put("/tech-admin/settings", { category, settings });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Settings updated",
        description: `${variables.category} settings have been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Toggle maintenance mode mutation
  const maintenanceMutation = useMutation({
    mutationFn: async ({ enabled, message }: { enabled: boolean; message?: string }) => {
      const response = await api.post("/tech-admin/settings/maintenance", { enabled, message });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: data.data.enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
        description: data.data.enabled ? "Users will see the maintenance message." : "System is now accessible.",
      });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to toggle maintenance mode",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const settings = settingsData?.settings;
  const environment = settingsData?.environment;

  // SMS Settings Form
  const SMSSettingsForm = () => {
    const [formData, setFormData] = useState({
      enabled: settings?.sms?.enabled ?? true,
      retryAttempts: settings?.sms?.retryAttempts ?? 3,
      retryDelayMs: settings?.sms?.retryDelayMs ?? 30000,
      dailyLimit: settings?.sms?.dailyLimit ?? 10000,
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>SMS Enabled</Label>
            <p className="text-sm text-muted-foreground">Enable or disable SMS sending</p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Retry Attempts</Label>
            <Input
              type="number"
              value={formData.retryAttempts}
              onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Retry Delay (ms)</Label>
            <Input
              type="number"
              value={formData.retryDelayMs}
              onChange={(e) => setFormData({ ...formData, retryDelayMs: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Daily Limit</Label>
          <Input
            type="number"
            value={formData.dailyLimit}
            onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
          />
        </div>
        <Button
          onClick={() => updateMutation.mutate({ category: "sms", settings: formData })}
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save SMS Settings
        </Button>
      </div>
    );
  };

  // Email Settings Form
  const EmailSettingsForm = () => {
    const [formData, setFormData] = useState({
      enabled: settings?.email?.enabled ?? true,
      retryAttempts: settings?.email?.retryAttempts ?? 3,
      retryDelayMs: settings?.email?.retryDelayMs ?? 2000,
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Enabled</Label>
            <p className="text-sm text-muted-foreground">Enable or disable email sending</p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Retry Attempts</Label>
            <Input
              type="number"
              value={formData.retryAttempts}
              onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Retry Delay (ms)</Label>
            <Input
              type="number"
              value={formData.retryDelayMs}
              onChange={(e) => setFormData({ ...formData, retryDelayMs: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <Button
          onClick={() => updateMutation.mutate({ category: "email", settings: formData })}
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Email Settings
        </Button>
      </div>
    );
  };

  // Notifications Settings Form
  const NotificationsSettingsForm = () => {
    const [formData, setFormData] = useState({
      taskAssignment: settings?.notifications?.taskAssignment ?? true,
      taskCompletion: settings?.notifications?.taskCompletion ?? true,
      taskReminder: settings?.notifications?.taskReminder ?? true,
      passwordReset: settings?.notifications?.passwordReset ?? true,
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Task Assignment</Label>
            <p className="text-sm text-muted-foreground">Notify users when assigned to tasks</p>
          </div>
          <Switch
            checked={formData.taskAssignment}
            onCheckedChange={(checked) => setFormData({ ...formData, taskAssignment: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Task Completion</Label>
            <p className="text-sm text-muted-foreground">Notify when tasks are completed</p>
          </div>
          <Switch
            checked={formData.taskCompletion}
            onCheckedChange={(checked) => setFormData({ ...formData, taskCompletion: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Task Reminder</Label>
            <p className="text-sm text-muted-foreground">Send task reminders</p>
          </div>
          <Switch
            checked={formData.taskReminder}
            onCheckedChange={(checked) => setFormData({ ...formData, taskReminder: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Password Reset</Label>
            <p className="text-sm text-muted-foreground">Send password reset notifications</p>
          </div>
          <Switch
            checked={formData.passwordReset}
            onCheckedChange={(checked) => setFormData({ ...formData, passwordReset: checked })}
          />
        </div>
        <Button
          onClick={() => updateMutation.mutate({ category: "notifications", settings: formData })}
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>
    );
  };

  // Security Settings Form
  const SecuritySettingsForm = () => {
    const [formData, setFormData] = useState({
      maxLoginAttempts: settings?.security?.maxLoginAttempts ?? 5,
      lockoutDurationMinutes: settings?.security?.lockoutDurationMinutes ?? 30,
      sessionTimeoutMinutes: settings?.security?.sessionTimeoutMinutes ?? 60,
      requireTwoFactor: settings?.security?.requireTwoFactor ?? false,
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Max Login Attempts</Label>
            <Input
              type="number"
              value={formData.maxLoginAttempts}
              onChange={(e) => setFormData({ ...formData, maxLoginAttempts: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Lockout Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.lockoutDurationMinutes}
              onChange={(e) => setFormData({ ...formData, lockoutDurationMinutes: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Session Timeout (minutes)</Label>
          <Input
            type="number"
            value={formData.sessionTimeoutMinutes}
            onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
          </div>
          <Switch
            checked={formData.requireTwoFactor}
            onCheckedChange={(checked) => setFormData({ ...formData, requireTwoFactor: checked })}
          />
        </div>
        <Button
          onClick={() => updateMutation.mutate({ category: "security", settings: formData })}
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Security Settings
        </Button>
      </div>
    );
  };

  // Maintenance Settings Form
  const MaintenanceSettingsForm = () => {
    const [formData, setFormData] = useState({
      enabled: settings?.maintenance?.enabled ?? false,
      message: settings?.maintenance?.message ?? "System is under maintenance. Please try again later.",
    });

    return (
      <div className="space-y-4">
        {formData.enabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Maintenance Mode is Active</p>
              <p className="text-sm text-yellow-700">Users cannot access the system.</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">Enable to block user access</p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, enabled: checked });
              maintenanceMutation.mutate({ enabled: checked, message: formData.message });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Maintenance Message</Label>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={3}
          />
        </div>
        <Button
          onClick={() => updateMutation.mutate({ category: "maintenance", settings: formData })}
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Maintenance Settings
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('tech_admin.settings.title')}</h1>
          <p className="text-muted-foreground">{t('tech_admin.settings.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["system-settings"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('tech_admin.refresh')}
        </Button>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Environment
          </CardTitle>
          <CardDescription>Current system configuration status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Environment</p>
                <p className="font-medium">{environment?.environment || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SMTP</p>
                <div className="flex items-center gap-1">
                  {environment?.smtpHost?.includes("configured") ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{environment?.smtpHost}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SMPP</p>
                <div className="flex items-center gap-1">
                  {environment?.smppHost?.includes("configured") ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{environment?.smppHost}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Redis</p>
                <div className="flex items-center gap-1">
                  {environment?.redisHost?.includes("configured") ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{environment?.redisHost}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MongoDB</p>
                <div className="flex items-center gap-1">
                  {environment?.mongoUri?.includes("configured") ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{environment?.mongoUri}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Manage system settings by category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">SMS</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span className="hidden sm:inline">Maintenance</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sms" className="mt-6">
                <SMSSettingsForm />
              </TabsContent>
              <TabsContent value="email" className="mt-6">
                <EmailSettingsForm />
              </TabsContent>
              <TabsContent value="notifications" className="mt-6">
                <NotificationsSettingsForm />
              </TabsContent>
              <TabsContent value="security" className="mt-6">
                <SecuritySettingsForm />
              </TabsContent>
              <TabsContent value="maintenance" className="mt-6">
                <MaintenanceSettingsForm />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
