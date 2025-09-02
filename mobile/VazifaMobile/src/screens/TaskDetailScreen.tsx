import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { taskAPI } from '../services/api';
import { Task } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type TaskDetailScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetail'>;

interface Props {
  route: TaskDetailScreenRouteProp;
  navigation: TaskDetailScreenNavigationProp;
}

const TaskDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const taskData = await taskAPI.getTaskById(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить задачу');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus: Task['status']) => {
    if (!task) return;

    setIsUpdating(true);
    try {
      const updatedTask = await taskAPI.updateTaskStatus(task._id, newStatus);
      setTask(updatedTask);
      Alert.alert('Успех', 'Статус задачи обновлен');
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Ошибка', 'Не удалось обновить статус задачи');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return 'Не указан';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'К выполнению';
      case 'in-progress':
        return 'В процессе';
      case 'completed':
        return 'Завершено';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in-progress':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const StatusButton = ({ status, title }: { status: Task['status']; title: string }) => (
    <TouchableOpacity
      style={[
        styles.statusButton,
        task?.status === status && styles.statusButtonActive,
        { borderColor: getStatusColor(status) },
        task?.status === status && { backgroundColor: getStatusColor(status) },
      ]}
      onPress={() => updateTaskStatus(status)}
      disabled={isUpdating || task?.status === status}
    >
      <Text
        style={[
          styles.statusButtonText,
          task?.status === status && styles.statusButtonTextActive,
          { color: task?.status === status ? '#fff' : getStatusColor(status) },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка задачи...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Задача не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{task.title}</Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          >
            <Text style={styles.priorityText}>
              {getPriorityText(task.priority)}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Ionicons
            name="information-circle"
            size={16}
            color={getStatusColor(task.status)}
          />
          <Text style={styles.statusText}>
            Статус: {getStatusText(task.status)}
          </Text>
        </View>
      </View>

      {task.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="person" size={20} color="#666" />
          <Text style={styles.infoLabel}>Создал:</Text>
          <Text style={styles.infoValue}>{task.createdBy.name}</Text>
        </View>

        {task.assignedTo && task.assignedTo.length > 0 && (
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.infoLabel}>Назначено:</Text>
            <Text style={styles.infoValue}>
              {task.assignedTo.map(user => user.name).join(', ')}
            </Text>
          </View>
        )}

        {task.dueDate && (
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoLabel}>Срок выполнения:</Text>
            <Text style={styles.infoValue}>
              {new Date(task.dueDate).toLocaleDateString('ru-RU')}
            </Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.infoLabel}>Создано:</Text>
          <Text style={styles.infoValue}>
            {new Date(task.createdAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>

        {task.updatedAt !== task.createdAt && (
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={20} color="#666" />
            <Text style={styles.infoLabel}>Обновлено:</Text>
            <Text style={styles.infoValue}>
              {new Date(task.updatedAt).toLocaleDateString('ru-RU')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Изменить статус</Text>
        <View style={styles.statusButtons}>
          <StatusButton status="todo" title="К выполнению" />
          <StatusButton status="in-progress" title="В процессе" />
          <StatusButton status="completed" title="Завершено" />
        </View>
      </View>

      {isUpdating && (
        <View style={styles.updatingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.updatingText}>Обновление...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FF3B30',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  updatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updatingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
});

export default TaskDetailScreen;
