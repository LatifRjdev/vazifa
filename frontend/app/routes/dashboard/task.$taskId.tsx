import { ArrowLeft, Calendar, Clock, User, Flag, Archive, MessageSquare, Plus, Edit, Trash2, CheckCircle, XCircle, Eye, EyeOff, Send, Star, Users, X } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateResponseMutation, useGetTaskResponsesByIdQuery, useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { useState } from "react";

import { Loader } from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchData, postData, deleteData } from "@/lib/fetch-utils";
import { formatDateDetailedRussian } from "@/lib/date-utils";
import { getTaskStatusRussian, getPriorityRussian } from "@/lib/translations";
import { useAuth } from "@/providers/auth-context";
import { TaskTitle } from "@/components/tasks/task-title";
import { TaskDescription } from "@/components/tasks/task-description";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { CommentSection } from "@/components/tasks/comment-section";
import { ResponseSection } from "@/components/tasks/response-section";
import { TaskActivity } from "@/components/tasks/task-activity";
import { WatchersList } from "@/components/tasks/watchers-list";
import type { Task, Comment } from "@/types";

export function meta() {
  return [
    { title: "Vazifa | Детали задачи" },
    { name: "description", content: "Просмотр деталей задачи в Vazifa!" },
  ];
}

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isWatching, setIsWatching] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubTask, setNewSubTask] = useState("");
  const [showSubTaskForm, setShowSubTaskForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showEditAssignees, setShowEditAssignees] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const { data, isPending, error } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchData(`/tasks/${taskId}`),
    enabled: !!taskId,
  }) as {
    data: { task: Task; comments: Comment[]; subTasks: Task[] };
    isPending: boolean;
    error: any;
  };

  const task = data?.task;
  const comments = data?.comments || [];
  const subTasks = data?.subTasks || [];

  // Проверка, является ли пользователь ответственным менеджером
  const isResponsibleManager = task?.responsibleManager && (
    typeof task.responsibleManager === 'string'
      ? task.responsibleManager === user?._id
      : task.responsibleManager._id === user?._id
  );

  // Проверка прав на изменение статуса (админы, главные менеджеры, ответственный менеджер)
  const canChangeStatus = user?.role && (
    ["admin", "super_admin", "chief_manager"].includes(user.role) ||
    isResponsibleManager
  );

  // Проверка прав на отмену задачи (админы, главные менеджеры, ответственный менеджер)
  const canCancel = user?.role && (
    ["admin", "super_admin", "chief_manager"].includes(user.role) ||
    isResponsibleManager
  );

  // Проверка прав на редактирование (админы, главные менеджеры, менеджеры)
  const canEdit = user?.role && ["admin", "super_admin", "chief_manager", "manager"].includes(user.role);

  // Мутация для добавления комментария
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => postData(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setNewComment("");
    },
  });

  // Мутация для добавления подзадачи
  const addSubTaskMutation = useMutation({
    mutationFn: (title: string) => postData(`/tasks/${taskId}/subtasks`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setNewSubTask("");
      setShowSubTaskForm(false);
    },
  });

  // Мутация для обновления статуса задачи
  const updateStatusMutation = useUpdateTaskStatusMutation();

  // Мутация для переключения наблюдения
  const toggleWatchMutation = useMutation({
    mutationFn: () => postData(`/tasks/${taskId}/watch`, {}),
    onSuccess: () => {
      setIsWatching(!isWatching);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  // Мутация для отметки как важная
  const markImportantMutation = useMutation({
    mutationFn: () => postData(`/tasks/${taskId}/mark-important`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  // Мутация для обновления исполнителей
  const updateAssigneesMutation = useMutation({
    mutationFn: async (assignees: string[]) => {
      console.log('=== MUTATION FUNCTION DEBUG ===');
      console.log('Assignees to send:', assignees);
      console.log('URL:', `/api-v1/tasks/${taskId}/assignees`);
      console.log('Token:', localStorage.getItem("token") ? 'Present' : 'Missing');
      
      const requestBody = { assignees };
      console.log('Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`/api-v1/tasks/${taskId}/assignees`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.message || 'Failed to update assignees');
      }
      
      const responseData = await response.json();
      console.log('Success response data:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('Success data:', data);
      // Invalidate and refetch task data
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.refetchQueries({ queryKey: ["task", taskId] });
      setShowEditAssignees(false);
    },
    onError: (error) => {
      console.log('=== MUTATION ERROR ===');
      console.error('Mutation error:', error);
      console.error('Error message:', error.message);
    },
  });

  // Запрос для получения всех пользователей - загружаем всегда для быстрого доступа
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchData("/users/all"),
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
      addSubTaskMutation.mutate(newSubTask);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handlePublishStatus = () => {
    if (selectedStatus && selectedStatus !== task?.status && taskId) {
      updateStatusMutation.mutate({ taskId, status: selectedStatus });
    }
  };

  // Инициализируем selectedStatus при загрузке задачи
  if (task && !selectedStatus) {
    setSelectedStatus(task.status);
  }

  const handleEditAssignees = () => {
    // Reset and set current assignees when opening modal
    const currentAssigneeIds = task?.assignees?.map(assignee => assignee._id) || [];
    setSelectedAssignees(currentAssigneeIds);
    setShowEditAssignees(true);
  };

  const handleSaveAssignees = async () => {
    console.log('=== SAVE ASSIGNEES DEBUG ===');
    console.log('Current selectedAssignees:', selectedAssignees);
    console.log('Task ID:', taskId);
    console.log('Current task assignees:', task?.assignees?.map(a => a._id));
    
    try {
      if (!selectedAssignees || selectedAssignees.length === 0) {
        console.log('Sending empty array');
        updateAssigneesMutation.mutate([]);
      } else {
        console.log('Sending assignees:', selectedAssignees);
        updateAssigneesMutation.mutate(selectedAssignees);
      }
    } catch (error) {
      console.error('Error in handleSaveAssignees:', error);
    }
  };

  const handleToggleAssignee = (userId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getBackUrl = () => {
    // Всегда перенаправляем на страницу "Все задачи"
    return '/dashboard/all-tasks';
  };

  if (isPending) {
    return <Loader message="Загрузка задачи..." />;
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-semibold">Задача не найдена</h2>
        <p className="text-muted-foreground">
          Запрашиваемая задача не существует или была удалена.
        </p>
        <Link to={getBackUrl()}>
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к задачам
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center justify-between">
        <Link to={getBackUrl()}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к задачам
          </Button>
        </Link>
        <div className="flex items-center space-x-2">
          {/* Кнопка "Отметить как важная" только для админов и супер админов */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <Button
              variant={task.isImportant ? "default" : "outline"}
              size="sm"
              onClick={() => markImportantMutation.mutate()}
              disabled={markImportantMutation.isPending}
            >
              <Star className={`h-4 w-4 mr-2 ${task.isImportant ? 'fill-current' : ''}`} />
              {task.isImportant ? "Важная" : "Отметить важной"}
            </Button>
          )}
          
          {/* Кнопка наблюдения только для админов, супер админов, главных менеджеров и менеджеров */}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleWatchMutation.mutate()}
            >
              {isWatching ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {isWatching ? "Не следить" : "Следить"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Основная информация о задаче */}
        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <TaskTitle title={task.title} taskId={taskId!} />
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Badge variant={task.status.toLowerCase() as any}>
                      {getTaskStatusRussian(task.status)}
                    </Badge>
                    {task.priority && (
                      <Badge
                        variant={
                          task.priority === "High" ? "destructive" : "secondary"
                        }
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        {getPriorityRussian(task.priority)}
                      </Badge>
                    )}
                    {task.isArchived && (
                      <Badge variant="outline">
                        <Archive className="h-3 w-3 mr-1" />
                        В архиве
                      </Badge>
                    )}
                    {task.isImportant && (
                      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Важная
                      </Badge>
                    )}
                  </div>
                </div>
                {canChangeStatus && (
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={handleStatusChange} value={selectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">К выполнению</SelectItem>
                        <SelectItem value="In Progress">В процессе</SelectItem>
                        <SelectItem value="Done">Выполнено</SelectItem>
                        {canCancel && <SelectItem value="Cancelled">Отменен</SelectItem>}
                      </SelectContent>
                    </Select>
                    {selectedStatus !== task.status && (
                      <Button
                        size="sm"
                        onClick={handlePublishStatus}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {updateStatusMutation.isPending ? "Публикация..." : "Опубликовать"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <TaskDescription description={task.description || ""} taskId={taskId!} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Исполнители:</span>
                    <span>
                      {task.assignees && task.assignees.length > 0
                        ? task.assignees.map(assignee => assignee?.name || 'Неизвестный').join(', ')
                        : "Не назначены"}
                    </span>
                    {/* Кнопка редактирования исполнителей только для админов, супер админов, главных менеджеров и менеджеров */}
                    {canEdit && (
                      <Dialog open={showEditAssignees} onOpenChange={setShowEditAssignees}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={handleEditAssignees}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Редактировать исполнителей</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600 mb-3">
                              Выберите участников для назначения на задачу:
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2">
                              {!usersData ? (
                                <div className="text-center py-4 text-gray-500">
                                  Загрузка пользователей...
                                </div>
                              ) : (usersData as any)?.users?.length > 0 ? (
                                (usersData as any).users.map((userItem: any) => {
                                  const isCurrentlyAssigned = task?.assignees?.some(assignee => assignee._id === userItem._id);
                                  const isSelected = selectedAssignees.includes(userItem._id);
                                  
                                  return (
                                    <div key={userItem._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                      <input
                                        type="checkbox"
                                        id={userItem._id}
                                        checked={isSelected}
                                        onChange={() => handleToggleAssignee(userItem._id)}
                                        className="rounded w-4 h-4"
                                      />
                                      <label htmlFor={userItem._id} className="flex items-center space-x-2 cursor-pointer flex-1">
                                        <span className="font-medium">{userItem.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {userItem.role === 'admin' ? 'Админ' : 
                                           userItem.role === 'manager' ? 'Менеджер' : 
                                           userItem.role === 'super_admin' ? 'Супер админ' : 'Участник'}
                                        </Badge>
                                        {isCurrentlyAssigned && (
                                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                            Назначен
                                          </Badge>
                                        )}
                                      </label>
                                    </div>
                                  );
                                })
                              ) : (usersData as any)?.length > 0 ? (
                                // Handle case where users is directly an array
                                (usersData as any).map((userItem: any) => {
                                  const isCurrentlyAssigned = task?.assignees?.some(assignee => assignee._id === userItem._id);
                                  const isSelected = selectedAssignees.includes(userItem._id);
                                  
                                  return (
                                    <div key={userItem._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                      <input
                                        type="checkbox"
                                        id={userItem._id}
                                        checked={isSelected}
                                        onChange={() => handleToggleAssignee(userItem._id)}
                                        className="rounded w-4 h-4"
                                      />
                                      <label htmlFor={userItem._id} className="flex items-center space-x-2 cursor-pointer flex-1">
                                        <span className="font-medium">{userItem.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {userItem.role === 'admin' ? 'Админ' : 
                                           userItem.role === 'manager' ? 'Менеджер' : 
                                           userItem.role === 'super_admin' ? 'Супер админ' : 'Участник'}
                                        </Badge>
                                        {isCurrentlyAssigned && (
                                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                            Назначен
                                          </Badge>
                                        )}
                                      </label>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  Пользователи не найдены
                                  <br />
                                  <small>Debug: {JSON.stringify(usersData)}</small>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 pt-2">
                              <Button 
                                onClick={handleSaveAssignees}
                                disabled={updateAssigneesMutation.isPending}
                                className="flex-1"
                              >
                                {updateAssigneesMutation.isPending ? "Сохранение..." : "Сохранить"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setShowEditAssignees(false)}
                                className="flex-1"
                              >
                                Отмена
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {/* Ответственный менеджер */}
                  {task.responsibleManager && typeof task.responsibleManager === 'object' && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Ответственный менеджер:</span>
                      <div className="flex items-center space-x-2">
                        {task.responsibleManager.profilePicture && (
                          <img
                            src={task.responsibleManager.profilePicture}
                            alt={task.responsibleManager.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium text-blue-600">
                          {task.responsibleManager.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Срок выполнения:</span>
                      <span>{formatDateDetailedRussian(task.dueDate)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Создано:</span>
                    <span>{formatDateDetailedRussian(task.createdAt)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Обновлено:</span>
                    <span>{formatDateDetailedRussian(task.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <TaskAttachments attachments={task.attachments || []} taskId={taskId!} />
            </CardContent>
          </Card>

          {/* Подзадачи */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Подзадачи ({subTasks.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSubTaskForm(!showSubTaskForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить подзадачу
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSubTaskForm && (
                <div className="mb-4 space-y-2">
                  <Input
                    placeholder="Название подзадачи..."
                    value={newSubTask}
                    onChange={(e) => setNewSubTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubTask()}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleAddSubTask} disabled={addSubTaskMutation.isPending}>
                      Добавить
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSubTaskForm(false)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
              
              {subTasks.length > 0 ? (
                <div className="space-y-2">
                  {subTasks.map((subTask) => (
                    <div key={subTask._id} className="flex items-center space-x-2 p-2 border rounded">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{subTask.title}</span>
                      <Badge variant={subTask.status.toLowerCase() as any}>
                        {getTaskStatusRussian(subTask.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Подзадачи отсутствуют
                </p>
              )}
            </CardContent>
          </Card>


          {/* Ответы - видны всем пользователям */}
          <ResponseSection taskId={taskId!} task={task} />

          {/* Комментарии для админов, супер админов, главных менеджеров и менеджеров */}
          {canEdit && (
            <CommentSection taskId={taskId!} members={[]} />
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-4 lg:space-y-6">
          {/* Наблюдатели */}
          <WatchersList watchers={task.watchers || []} />
          
          {/* История активности */}
          <TaskActivity resourceId={taskId!} />
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
