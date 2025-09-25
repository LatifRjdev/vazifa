import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { taskAPI, userAPI } from '../services/api';
import { User, Task } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type CreateTaskScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateTask'>;

interface Props {
  navigation: CreateTaskScreenNavigationProp;
}

const CreateTaskScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Название задачи не может быть пустым');
      return;
    }

    setIsLoading(true);
    try {
      const taskData: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate?.toISOString(),
        assignedTo: selectedUsers.length > 0 ? selectedUsers.map(id => ({ _id: id } as User)) : undefined,
      };

      await taskAPI.createTask(taskData);
      Alert.alert('Успех', 'Задача создана успешно', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось создать задачу');
    } finally {
      setIsLoading(false);
    }
  };


  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getPriorityColor = (priorityValue: Task['priority']) => {
    switch (priorityValue) {
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

  const getPriorityText = (priorityValue: Task['priority']) => {
    switch (priorityValue) {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Название задачи *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Введите название задачи"
            multiline={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Введите описание задачи"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Приоритет</Text>
          <View style={styles.priorityContainer}>
            {(['low', 'medium', 'high'] as Task['priority'][]).map((priorityValue) => (
              <TouchableOpacity
                key={priorityValue}
                style={[
                  styles.priorityButton,
                  priority === priorityValue && styles.priorityButtonActive,
                  { borderColor: getPriorityColor(priorityValue) },
                  priority === priorityValue && { backgroundColor: getPriorityColor(priorityValue) },
                ]}
                onPress={() => setPriority(priorityValue)}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === priorityValue && styles.priorityButtonTextActive,
                    { color: priority === priorityValue ? '#fff' : getPriorityColor(priorityValue) },
                  ]}
                >
                  {getPriorityText(priorityValue)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Срок выполнения</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setDueDate(tomorrow);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateButtonText}>
              {dueDate ? dueDate.toLocaleDateString('ru-RU') : 'Установить на завтра'}
            </Text>
            {dueDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setDueDate(null)}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {users.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Назначить пользователям</Text>
            <View style={styles.usersContainer}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={[
                    styles.userItem,
                    selectedUsers.includes(user._id) && styles.userItemSelected,
                  ]}
                  onPress={() => toggleUserSelection(user._id)}
                >
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>
                        {user.name} {user.lastName}
                      </Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>
                  {selectedUsers.includes(user._id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateTask}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Создание...' : 'Создать задачу'}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearDateButton: {
    marginLeft: 8,
  },
  usersContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateTaskScreen;
