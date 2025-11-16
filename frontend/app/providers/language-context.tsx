import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type Language = 'ru' | 'tj';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Переводы
const translations = {
  ru: {
    // Общие
    'app.name': 'Протокол',
    'app.tagline': 'Система управления задачами',
    'common.loading': 'Загрузка...',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.create': 'Создать',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.all': 'Все',
    'common.yes': 'Да',
    'common.no': 'Нет',
    
    // Навигация
    'nav.dashboard': 'Панель управления',
    'nav.tasks': 'Задачи',
    'nav.my_tasks': 'Мои задачи',
    'nav.all_tasks': 'Все задачи',
    'nav.manager_tasks': 'Задачи менеджера',
    'nav.important_tasks': 'Важные задачи',
    'nav.completed_tasks': 'Выполненные задачи',
    'nav.analytics': 'Аналитика',
    'nav.members': 'Участники',
    'nav.admin_chat': 'Админ чат',
    'nav.profile': 'Профиль',
    'nav.settings': 'Настройки',
    'nav.logout': 'Выйти',
    
    // Задачи
    'tasks.create_task': 'Создать задачу',
    'tasks.task_title': 'Название задачи',
    'tasks.task_description': 'Описание задачи',
    'tasks.task_status': 'Статус',
    'tasks.task_priority': 'Приоритет',
    'tasks.task_assignees': 'Исполнители',
    'tasks.task_manager': 'Ответственный менеджер',
    'tasks.due_date': 'Срок выполнения',
    'tasks.no_tasks': 'Нет задач',
    'tasks.task_created': 'Задача создана',
    'tasks.task_updated': 'Задача обновлена',
    'tasks.task_deleted': 'Задача удалена',
    
    // Статусы
    'status.todo': 'К выполнению',
    'status.in_progress': 'В процессе',
    'status.review': 'На проверке',
    'status.done': 'Выполнено',
    
    // Приоритеты
    'priority.low': 'Низкий',
    'priority.medium': 'Средний',
    'priority.high': 'Высокий',
    
    // Роли
    'role.admin': 'Админ',
    'role.manager': 'Менеджер',
    'role.member': 'Участник',
    'role.super_admin': 'Супер админ',
    
    // Ответы и комментарии
    'responses.title': 'Ответы',
    'responses.add_response': 'Добавить ответ',
    'responses.send_response': 'Отправить ответ',
    'responses.no_responses': 'Нет ответов',
    'responses.attach_file': 'Прикрепить файл',
    'responses.voice_message': 'Голосовое сообщение',
    
    'comments.title': 'Комментарии',
    'comments.add_comment': 'Добавить комментарий',
    'comments.send_comment': 'Отправить комментарий',
    'comments.no_comments': 'Нет комментариев',
    
    // Файлы
    'files.download': 'Скачать',
    'files.preview': 'Просмотр',
    'files.upload': 'Загрузить файл',
    'files.uploading': 'Загрузка...',
    
    // Уведомления
    'notifications.task_assigned': 'Вам назначена новая задача',
    'notifications.task_completed': 'Задача выполнена',
    'notifications.new_comment': 'Новый комментарий',
    'notifications.new_response': 'Новый ответ',
    
    // Общие фразы
    'common.created': 'Создано',
    'tasks.no_tasks_yet': 'У вас пока нет задач',
    'common.loading_data': 'Загрузка данных...',
    
    // Статистика и панель управления
    'dashboard.total_tasks': 'Всего задач',
    'dashboard.in_progress': 'В процессе',
    'dashboard.completed': 'Выполнено',
    'dashboard.overdue': 'Просрочено',
    'dashboard.recent_tasks': 'Последние задачи',
    'dashboard.statistics': 'Статистика',
    'dashboard.overview': 'Обзор',
    
    // Действия с задачами
    'tasks.mark_important': 'Отметить как важное',
    'tasks.unmark_important': 'Убрать из важных',
    'tasks.edit_assignees': 'Редактировать исполнителей',
    'tasks.watch': 'Следить',
    'tasks.unwatch': 'Не следить',
    'tasks.important_tasks': 'Важные задачи',
    
    // Важные задачи страница
    'important_tasks.title': 'Важные задачи',
    'important_tasks.description': 'Задачи, отмеченные администраторами как важные',
    'important_tasks.no_access': 'У вас нет доступа к этой странице. Только супер админы могут просматривать важные задачи.',
    'important_tasks.no_tasks_title': 'Нет важных задач',
    'important_tasks.no_tasks_description': 'Пока нет задач, отмеченных как важные',
    'important_tasks.marked_important': 'Отмечено как важное',
    'important_tasks.by_admin': 'администратором',
    'important_tasks.assignees': 'исполнителей',
    'important_tasks.assignee': 'исполнитель',
    'important_tasks.manager': 'Менеджер:',
    'important_tasks.not_specified': 'Не указан',
    
    // Участники
    'members.remove_member': 'Удалить участника',
    'members.confirm_remove': 'Вы уверены, что хотите удалить этого участника?',
    'members.member_removed': 'Участник удален',
    
    // Сортировка и фильтрация
    'sort.oldest_first': 'Сначала старые',
    'sort.newest_first': 'Сначала новые',
    'filter.filter': 'Фильтр',
    'filter.filter_tasks': 'Фильтровать задачи',
    'filter.all_tasks': 'Все задачи',
    'filter.high_priority': 'Высокий приоритет',
    'filter.archived': 'В архиве',
    'search.find_tasks': 'Найти задачи...',
    'tabs.list': 'Список',
    'tabs.board': 'Доска',
    'tasks.assigned_to_you': 'назначенных вам задач',
    'tasks.no_matching_tasks': 'Задач, соответствующих вашим критериям, не найдено.',
    'tasks.due_date_short': 'Срок',
    'tasks.modified': 'Изменено',
    'tasks.completed_badge': 'Завершено',
    'tasks.no_tasks_in_progress': 'Нет задач в процессе',
    'tasks.no_completed_tasks': 'Нет выполненных задач',
    
    // Все задачи страница
    'all_tasks.title': 'Все задачи',
    'all_tasks.description': 'Управление всеми задачами в организациях',
    'all_tasks.access_denied': 'Доступ запрещен',
    'all_tasks.no_access_message': 'У вас нет прав для просмотра всех задач. Обратитесь к администратору.',
    'all_tasks.loading': 'Загрузка задач...',
    'all_tasks.filters_search': 'Фильтры и поиск',
    'all_tasks.search_placeholder': 'Поиск по названию или описанию...',
    'all_tasks.all_statuses': 'Все статусы',
    'all_tasks.all_priorities': 'Все приоритеты',
    'all_tasks.time_filter': 'Фильтр по времени создания',
    'all_tasks.period': 'Период',
    'all_tasks.all_time': 'Все время',
    'all_tasks.today': 'За сегодня',
    'all_tasks.week': 'За неделю',
    'all_tasks.month': 'За месяц',
    'all_tasks.six_months': 'За 6 месяцев',
    'all_tasks.year': 'За год',
    'all_tasks.custom_period': 'Произвольный период',
    'all_tasks.date_from': 'Дата от',
    'all_tasks.date_to': 'Дата до',
    'all_tasks.reset_period': 'Сбросить период',
    'all_tasks.sort_by': 'Сортировать по',
    'all_tasks.sort_created': 'Дате создания',
    'all_tasks.sort_title': 'Названию',
    'all_tasks.sort_status': 'Статусу',
    'all_tasks.sort_priority': 'Приоритету',
    'all_tasks.sort_due_date': 'Сроку выполнения',
    'all_tasks.statistics_period': 'Статистика',
    'all_tasks.for_period': 'За период',
    'all_tasks.total_tasks': 'Всего задач',
    'all_tasks.from_total': 'из {total} всего',
    'all_tasks.high_priority': 'Высокий приоритет',
    'all_tasks.table_number': '#',
    'all_tasks.table_title': 'Название',
    'all_tasks.table_status': 'Статус',
    'all_tasks.table_priority': 'Приоритет',
    'all_tasks.table_assigned': 'Назначено',
    'all_tasks.table_due_date': 'Срок',
    'all_tasks.table_created': 'Создано',
    'all_tasks.table_actions': 'Действия',
    'all_tasks.not_assigned': 'Не назначено',
    'all_tasks.not_specified': 'Не указан',
    'all_tasks.tasks_count': 'Задачи ({filtered} из {total})',
    'all_tasks.no_tasks_found': 'Задач, соответствующих критериям, не найдено',
    
    // Менеджерские задачи
    'manager_tasks.title': 'Мои задачи как ответственного менеджера',
    'manager_tasks.description': 'Задачи, где вы назначены ответственным менеджером',
    'manager_tasks.no_access': 'У вас нет доступа к этой странице',
    'manager_tasks.no_tasks_title': 'Нет задач как ответственного менеджера',
    'manager_tasks.no_tasks_description': 'У вас пока нет задач, где вы назначены ответственным менеджером',
    'manager_tasks.assignees_count': '{count} исполнителей',
    
    // Аналитика
    'analytics.title': 'Аналитика',
    'analytics.description': 'Статистика и аналитика по задачам',
    'analytics.access_denied': 'Доступ запрещен',
    'analytics.no_access_message': 'У вас нет прав для просмотра аналитики. Обратитесь к администратору.',
    'analytics.loading': 'Загрузка аналитики...',
    'analytics.filters': 'Фильтры',
    'analytics.time_period': 'Период времени',
    'analytics.member': 'Участник',
    'analytics.all_members': 'Все участники',
    'analytics.last_day': 'Последний день',
    'analytics.last_7_days': 'Последние 7 дней',
    'analytics.last_month': 'Последний месяц',
    'analytics.last_6_months': 'Последние 6 месяцев',
    'analytics.last_year': 'Последний год',
    'analytics.total_tasks': 'Всего задач',
    'analytics.completed': 'Выполнено',
    'analytics.in_progress': 'В процессе',
    'analytics.overdue': 'Просрочено',
    'analytics.for_selected_period': 'За выбранный период',
    'analytics.completion_rate': 'Процент выполнения: {rate}%',
    'analytics.active_tasks': 'Активные задачи',
    'analytics.require_attention': 'Требуют внимания',
    'analytics.status_distribution': 'Распределение по статусам',
    'analytics.status_distribution_desc': 'Общее количество задач по статусам',
    'analytics.priority_distribution': 'Распределение по приоритетам',
    'analytics.priority_distribution_desc': 'Общее количество задач по приоритетам',
    'analytics.member_tasks': 'Задачи участника: {name}',
    'analytics.total_tasks_count': 'Всего задач: {count}',
    'analytics.detailed_stats': 'Детальная статистика',
    'analytics.percentage_ratio': 'Процентное соотношение задач',
    'analytics.member_stats': 'Статистика по участникам',
    'analytics.member_stats_desc': 'Количество задач на каждого участника',
    'analytics.activity_timeline': 'Активность за период',
    'analytics.activity_timeline_desc': 'Создание и выполнение задач по времени',
    'analytics.created': 'Создано',
    'analytics.completed_tasks': 'Выполнено',
    'analytics.tasks_count_suffix': 'задач',
    'analytics.chart_title': 'Диаграмма - Vazifa',
    'analytics.chart_analytics': 'Аналитика Vazifa',
    
    // Ошибки
    'errors.generic': 'Произошла ошибка',
    'errors.network': 'Ошибка сети',
    'errors.unauthorized': 'Нет доступа',
    'errors.not_found': 'Не найдено',
  },
  tj: {
    // Общие
    'app.name': 'Протокол',
    'app.tagline': 'Системаи идоракунии вазифаҳо',
    'common.loading': 'Бор шуда истодааст...',
    'common.save': 'Захира кардан',
    'common.cancel': 'Бекор кардан',
    'common.delete': 'Нест кардан',
    'common.edit': 'Таҳрир кардан',
    'common.create': 'Эҷод кардан',
    'common.search': 'Ҷустуҷӯ',
    'common.filter': 'Филтр',
    'common.all': 'Ҳама',
    'common.yes': 'Ҳа',
    'common.no': 'Не',
    
    // Навигация
    'nav.dashboard': 'Лавҳаи идоракунӣ',
    'nav.tasks': 'Вазифаҳо',
    'nav.my_tasks': 'Вазифаҳои ман',
    'nav.all_tasks': 'Ҳамаи вазифаҳо',
    'nav.manager_tasks': 'Вазифаҳои менеҷер',
    'nav.important_tasks': 'Вазифаҳои муҳим',
    'nav.completed_tasks': 'Вазифаҳои иҷрошуда',
    'nav.analytics': 'Таҳлилот',
    'nav.members': 'Иштирокчиён',
    'nav.admin_chat': 'Чати маъмур',
    'nav.profile': 'Профил',
    'nav.settings': 'Танзимот',
    'nav.logout': 'Баромадан',
    
    // Задачи
    'tasks.create_task': 'Вазифа эҷод кардан',
    'tasks.task_title': 'Номи вазифа',
    'tasks.task_description': 'Тавсифи вазифа',
    'tasks.task_status': 'Ҳолат',
    'tasks.task_priority': 'Аввалият',
    'tasks.task_assignees': 'Иҷрокунандагон',
    'tasks.task_manager': 'Менеҷери масъул',
    'tasks.due_date': 'Мӯҳлати иҷро',
    'tasks.no_tasks': 'Вазифаҳо нестанд',
    'tasks.task_created': 'Вазифа эҷод шуд',
    'tasks.task_updated': 'Вазифа навсозӣ шуд',
    'tasks.task_deleted': 'Вазифа нест шуд',
    
    // Статусы
    'status.todo': 'Барои иҷро',
    'status.in_progress': 'Дар ҷараён',
    'status.review': 'Дар баррасӣ',
    'status.done': 'Иҷрошуда',
    
    // Приоритеты
    'priority.low': 'Паст',
    'priority.medium': 'Миёна',
    'priority.high': 'Баланд',
    
    // Роли
    'role.admin': 'Админ',
    'role.manager': 'Менеҷер',
    'role.member': 'Иштирокчӣ',
    'role.super_admin': 'Супер админ',
    
    // Ответы и комментарии
    'responses.title': 'Ҷавобҳо',
    'responses.add_response': 'Ҷавоб илова кардан',
    'responses.send_response': 'Ҷавоб фиристодан',
    'responses.no_responses': 'Ҷавобҳо нестанд',
    'responses.attach_file': 'Файл замима кардан',
    'responses.voice_message': 'Паёми овозӣ',
    
    'comments.title': 'Шарҳҳо',
    'comments.add_comment': 'Шарҳ илова кардан',
    'comments.send_comment': 'Шарҳ фиристодан',
    'comments.no_comments': 'Шарҳҳо нестанд',
    
    // Файлы
    'files.download': 'Боргирӣ кардан',
    'files.preview': 'Пешнамоиш',
    'files.upload': 'Файл боркардан',
    'files.uploading': 'Бор шуда истодааст...',
    
    // Уведомления
    'notifications.task_assigned': 'Ба шумо вазифаи нав таъин шуд',
    'notifications.task_completed': 'Вазифа иҷро шуд',
    'notifications.new_comment': 'Шарҳи нав',
    'notifications.new_response': 'Ҷавоби нав',
    
    // Общие фразы
    'common.created': 'Эҷодшуда',
    'tasks.no_tasks_yet': 'Шумо то ҳол вазифаҳо надоред',
    'common.loading_data': 'Маълумот бор шуда истодааст...',
    
    // Статистика и панель управления
    'dashboard.total_tasks': 'Ҳамаи вазифаҳо',
    'dashboard.in_progress': 'Дар ҷараён',
    'dashboard.completed': 'Иҷрошуда',
    'dashboard.overdue': 'Мӯҳлат гузашта',
    'dashboard.recent_tasks': 'Вазифаҳои охирин',
    'dashboard.statistics': 'Омор',
    'dashboard.overview': 'Умумӣ',
    
    // Действия с задачами
    'tasks.mark_important': 'Ҳамчун муҳим қайд кардан',
    'tasks.unmark_important': 'Аз муҳимҳо хориҷ кардан',
    'tasks.edit_assignees': 'Иҷрокунандагонро таҳрир кардан',
    'tasks.watch': 'Назорат кардан',
    'tasks.unwatch': 'Назорат накардан',
    'tasks.important_tasks': 'Вазифаҳои муҳим',
    
    // Важные задачи страница
    'important_tasks.title': 'Вазифаҳои муҳим',
    'important_tasks.description': 'Вазифаҳое, ки маъмурон ҳамчун муҳим қайд кардаанд',
    'important_tasks.no_access': 'Шумо ба ин саҳифа дастрасӣ надоред. Танҳо супер маъмурон метавонанд вазифаҳои муҳимро бубинанд.',
    'important_tasks.no_tasks_title': 'Вазифаҳои муҳим нестанд',
    'important_tasks.no_tasks_description': 'То ҳол вазифаҳое, ки ҳамчун муҳим қайд шуда бошанд, нестанд',
    'important_tasks.marked_important': 'Ҳамчун муҳим қайд шуда',
    'important_tasks.by_admin': 'маъмур',
    'important_tasks.assignees': 'иҷрокунандагон',
    'important_tasks.assignee': 'иҷрокунанда',
    'important_tasks.manager': 'Менеҷер:',
    'important_tasks.not_specified': 'Муайян нашуда',
    
    // Участники
    'members.remove_member': 'Иштирокчиро хориҷ кардан',
    'members.confirm_remove': 'Шумо мутмаин ҳастед, ки мехоҳед ин иштирокчиро хориҷ кунед?',
    'members.member_removed': 'Иштирокчӣ хориҷ карда шуд',
    
    // Сортировка и фильтрация
    'sort.oldest_first': 'Аввал кӯҳнаҳо',
    'sort.newest_first': 'Аввал навҳо',
    'filter.filter': 'Филтр',
    'filter.filter_tasks': 'Вазифаҳоро филтр кардан',
    'filter.all_tasks': 'Ҳамаи вазифаҳо',
    'filter.high_priority': 'Аввалияти баланд',
    'filter.archived': 'Дар бойгонӣ',
    'search.find_tasks': 'Вазифаҳоро ёфтан...',
    'tabs.list': 'Рӯйхат',
    'tabs.board': 'Тахта',
    'tasks.assigned_to_you': 'ба шумо таъин шудаанд',
    'tasks.no_matching_tasks': 'Вазифаҳое, ки ба меъёрҳои шумо мувофиқ мебошанд, ёфт нашуданд.',
    'tasks.due_date_short': 'Мӯҳлат',
    'tasks.modified': 'Тағйир ёфта',
    'tasks.completed_badge': 'Анҷомёфта',
    'tasks.no_tasks_in_progress': 'Вазифаҳо дар ҷараён нестанд',
    'tasks.no_completed_tasks': 'Вазифаҳои анҷомёфта нестанд',
    
    // Все задачи страница
    'all_tasks.title': 'Ҳамаи вазифаҳо',
    'all_tasks.description': 'Идоракунии ҳамаи вазифаҳо дар ташкилотҳо',
    'all_tasks.access_denied': 'Дастрасӣ манъ аст',
    'all_tasks.no_access_message': 'Шумо ҳуқуқи дидани ҳамаи вазифаҳоро надоред. Ба маъмур муроҷиат кунед.',
    'all_tasks.loading': 'Вазифаҳо бор шуда истодаанд...',
    'all_tasks.filters_search': 'Филтрҳо ва ҷустуҷӯ',
    'all_tasks.search_placeholder': 'Ҷустуҷӯ аз рӯи ном ё тавсиф...',
    'all_tasks.all_statuses': 'Ҳамаи ҳолатҳо',
    'all_tasks.all_priorities': 'Ҳамаи аввалиятҳо',
    'all_tasks.time_filter': 'Филтр аз рӯи вақти эҷод',
    'all_tasks.period': 'Давра',
    'all_tasks.all_time': 'Ҳамаи вақт',
    'all_tasks.today': 'Барои имрӯз',
    'all_tasks.week': 'Барои ҳафта',
    'all_tasks.month': 'Барои моҳ',
    'all_tasks.six_months': 'Барои 6 моҳ',
    'all_tasks.year': 'Барои сол',
    'all_tasks.custom_period': 'Давраи дилхоҳ',
    'all_tasks.date_from': 'Аз сана',
    'all_tasks.date_to': 'То сана',
    'all_tasks.reset_period': 'Давраро бекор кардан',
    'all_tasks.sort_by': 'Мураттаб кардан аз рӯи',
    'all_tasks.sort_created': 'Санаи эҷод',
    'all_tasks.sort_title': 'Ном',
    'all_tasks.sort_status': 'Ҳолат',
    'all_tasks.sort_priority': 'Аввалият',
    'all_tasks.sort_due_date': 'Мӯҳлати иҷро',
    'all_tasks.statistics_period': 'Омор',
    'all_tasks.for_period': 'Барои давра',
    'all_tasks.total_tasks': 'Ҳамаи вазифаҳо',
    'all_tasks.from_total': 'аз {total} умуман',
    'all_tasks.high_priority': 'Аввалияти баланд',
    'all_tasks.table_number': '№',
    'all_tasks.table_title': 'Ном',
    'all_tasks.table_status': 'Ҳолат',
    'all_tasks.table_priority': 'Аввалият',
    'all_tasks.table_assigned': 'Таъин шуда',
    'all_tasks.table_due_date': 'Мӯҳлат',
    'all_tasks.table_created': 'Эҷодшуда',
    'all_tasks.table_actions': 'Амалҳо',
    'all_tasks.not_assigned': 'Таъин нашуда',
    'all_tasks.not_specified': 'Муайян нашуда',
    'all_tasks.tasks_count': 'Вазифаҳо ({filtered} аз {total})',
    'all_tasks.no_tasks_found': 'Вазифаҳое, ки ба меъёрҳо мувофиқ мебошанд, ёфт нашуданд',
    
    // Менеджерские задачи
    'manager_tasks.title': 'Вазифаҳои ман ҳамчун менеҷери масъул',
    'manager_tasks.description': 'Вазифаҳое, ки шумо ҳамчун менеҷери масъул таъин шудаед',
    'manager_tasks.no_access': 'Шумо ба ин саҳифа дастрасӣ надоред',
    'manager_tasks.no_tasks_title': 'Вазифаҳо ҳамчун менеҷери масъул нестанд',
    'manager_tasks.no_tasks_description': 'Шумо то ҳол вазифаҳое надоред, ки дар онҳо ҳамчун менеҷери масъул таъин шуда бошед',
    'manager_tasks.assignees_count': '{count} иҷрокунанда',
    
    // Аналитика
    'analytics.title': 'Таҳлилот',
    'analytics.description': 'Омор ва таҳлилоти вазифаҳо',
    'analytics.access_denied': 'Дастрасӣ манъ аст',
    'analytics.no_access_message': 'Шумо ҳуқуқи дидани таҳлилотро надоред. Ба маъмур муроҷиат кунед.',
    'analytics.loading': 'Таҳлилот бор шуда истодааст...',
    'analytics.filters': 'Филтрҳо',
    'analytics.time_period': 'Давраи вақт',
    'analytics.member': 'Иштирокчӣ',
    'analytics.all_members': 'Ҳамаи иштирокчиён',
    'analytics.last_day': 'Рӯзи охирин',
    'analytics.last_7_days': 'Охирин 7 рӯз',
    'analytics.last_month': 'Моҳи охирин',
    'analytics.last_6_months': 'Охирин 6 моҳ',
    'analytics.last_year': 'Соли охирин',
    'analytics.total_tasks': 'Ҳамаи вазифаҳо',
    'analytics.completed': 'Иҷрошуда',
    'analytics.in_progress': 'Дар ҷараён',
    'analytics.overdue': 'Мӯҳлат гузашта',
    'analytics.for_selected_period': 'Барои давраи интихобшуда',
    'analytics.completion_rate': 'Фоизи иҷро: {rate}%',
    'analytics.active_tasks': 'Вазифаҳои фаъол',
    'analytics.require_attention': 'Диққат талаб мекунанд',
    'analytics.status_distribution': 'Тақсимот аз рӯи ҳолат',
    'analytics.status_distribution_desc': 'Миқдори умумии вазифаҳо аз рӯи ҳолат',
    'analytics.priority_distribution': 'Тақсимот аз рӯи аввалият',
    'analytics.priority_distribution_desc': 'Миқдори умумии вазифаҳо аз рӯи аввалият',
    'analytics.member_tasks': 'Вазифаҳои иштирокчӣ: {name}',
    'analytics.total_tasks_count': 'Ҳамаи вазифаҳо: {count}',
    'analytics.detailed_stats': 'Омори муфассал',
    'analytics.percentage_ratio': 'Нисбати фоизии вазифаҳо',
    'analytics.member_stats': 'Омор аз рӯи иштирокчиён',
    'analytics.member_stats_desc': 'Миқдори вазифаҳо барои ҳар иштирокчӣ',
    'analytics.activity_timeline': 'Фаъолият дар давра',
    'analytics.activity_timeline_desc': 'Эҷод ва иҷрои вазифаҳо аз рӯи вақт',
    'analytics.created': 'Эҷодшуда',
    'analytics.completed_tasks': 'Иҷрошуда',
    'analytics.tasks_count_suffix': 'вазифа',
    'analytics.chart_title': 'Диаграмма - Vazifa',
    'analytics.chart_analytics': 'Таҳлилоти Vazifa',
    
    // Ошибки
    'errors.generic': 'Хатогӣ рух дод',
    'errors.network': 'Хатогии шабака',
    'errors.unauthorized': 'Дастрасӣ нест',
    'errors.not_found': 'Ёфт нашуд',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>('ru');

  // Загрузить язык из localStorage при инициализации
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'tj')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
