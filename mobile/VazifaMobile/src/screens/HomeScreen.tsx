import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../services/api';
import { Task } from '../types';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const myTasks = await taskAPI.getMyTasks();
      setTasks(myTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить задачи');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
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

  const todoTasks = getTasksByStatus('todo');
  const inProgressTasks = getTasksByStatus('in-progress');
  const completedTasks = getTasksByStatus('completed');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Привет, {user?.name}! 👋
        </Text>
        <Text style={styles.subtitle}>
          Вот обзор ваших задач
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.statNumber}>{todoTasks.length}</Text>
          <Text style={styles.statLabel}>К выполнению</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FF9500' }]}>
          <Text style={styles.statNumber}>{inProgressTasks.length}</Text>
          <Text style={styles.statLabel}>В процессе</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#34C759' }]}>
          <Text style={styles.statNumber}>{completedTasks.length}</Text>
          <Text style={styles.statLabel}>Завершено</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Последние задачи</Text>
        {tasks.slice(0, 5).map((task) => (
          <TouchableOpacity key={task._id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {task.title}
              </Text>
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
            {task.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
              </Text>
            )}
            <View style={styles.taskFooter}>
              <View style={styles.statusContainer}>
                <Ionicons
                  name={
                    task.status === 'completed'
                      ? 'checkmark-circle'
                      : task.status === 'in-progress'
                      ? 'time'
                      : 'ellipse-outline'
                  }
                  size={16}
                  color={
                    task.status === 'completed'
                      ? '#34C759'
                      : task.status === 'in-progress'
                      ? '#FF9500'
                      : '#8E8E93'
                  }
                />
                <Text style={styles.statusText}>
                  {task.status === 'completed'
                    ? 'Завершено'
                    : task.status === 'in-progress'
                    ? 'В процессе'
                    : 'К выполнению'}
                </Text>
              </View>
              {task.dueDate && (
                <Text style={styles.dueDate}>
                  {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default HomeScreen;
