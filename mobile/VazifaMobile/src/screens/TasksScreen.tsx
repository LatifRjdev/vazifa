import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { taskAPI } from '../services/api';
import { Task } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: TasksScreenNavigationProp;
}

const TasksScreen: React.FC<Props> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const allTasks = await taskAPI.getAllTasks();
      setTasks(allTasks);
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

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.status === filter);
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

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in-progress':
        return 'time';
      default:
        return 'ellipse-outline';
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

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        >
          <Text style={styles.priorityText}>
            {getPriorityText(item.priority)}
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.taskFooter}>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
        
        {item.dueDate && (
          <Text style={styles.dueDate}>
            {new Date(item.dueDate).toLocaleDateString('ru-RU')}
          </Text>
        )}
      </View>
      
      <View style={styles.taskMeta}>
        <Text style={styles.createdBy}>
          Создал: {item.createdBy.name}
        </Text>
        {item.assignedTo && item.assignedTo.length > 0 && (
          <Text style={styles.assignedTo}>
            Назначено: {item.assignedTo.map(user => user.name).join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ 
    title, 
    value, 
    count 
  }: { 
    title: string; 
    value: typeof filter; 
    count: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const filteredTasks = getFilteredTasks();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filterContainer}>
          <FilterButton 
            title="Все" 
            value="all" 
            count={tasks.length} 
          />
          <FilterButton 
            title="К выполнению" 
            value="todo" 
            count={tasks.filter(t => t.status === 'todo').length} 
          />
          <FilterButton 
            title="В процессе" 
            value="in-progress" 
            count={tasks.filter(t => t.status === 'in-progress').length} 
          />
          <FilterButton 
            title="Завершено" 
            value="completed" 
            count={tasks.filter(t => t.status === 'completed').length} 
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateTask')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Задач не найдено</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
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
    marginBottom: 8,
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
  taskMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  createdBy: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  assignedTo: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 16,
  },
});

export default TasksScreen;
