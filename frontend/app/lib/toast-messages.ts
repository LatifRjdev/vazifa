// Centralized Russian toast messages for the application
export const toastMessages = {
  // Authentication messages
  auth: {
    signUpSuccess: "Пользователь успешно зарегистрирован",
    signUpSuccessDescription: "Пожалуйста, проверьте свою электронную почту для подтверждения",
    signUpFailed: "Ошибка регистрации",
    loginSuccess: "Успешный вход в систему",
    loginFailed: "Ошибка входа",
    logoutSuccess: "Вы успешно вышли из системы",
    emailVerificationSent: "Код подтверждения отправлен на вашу электронную почту",
    emailVerified: "Электронная почта успешно подтверждена",
    passwordResetSent: "Ссылка для сброса пароля отправлена на вашу электронную почту",
    passwordResetSuccess: "Пароль успешно изменен",
    invalidCredentials: "Неверные учетные данные",
    accountNotVerified: "Пожалуйста, подтвердите свою электронную почту",
    twoFARequired: "Требуется двухфакторная аутентификация",
    twoFAEnabled: "Двухфакторная аутентификация успешно включена",
    twoFADisabled: "Двухфакторная аутентификация отключена",
    invalidCode: "Неверный код подтверждения",
    oauthSuccess: "Успешный вход через OAuth",
    oauthError: "Ошибка аутентификации. Попробуйте снова",
    appleComingSoon: "Аутентификация Apple будет добавлена в следующем обновлении",
    tokenNotFound: "Токен аутентификации не найден",
    invalidToken: "Неверный токен аутентификации",
  },

  // Profile messages
  profile: {
    updateSuccess: "Профиль успешно обновлен",
    updateFailed: "Не удалось обновить профиль",
    passwordUpdateSuccess: "Пароль успешно обновлен. Вы будете перенаправлены на страницу входа",
    passwordUpdateFailed: "Не удалось обновить пароль",
    avatarUploadSuccess: "Аватар успешно загружен",
    avatarUploadFailed: "Не удалось загрузить аватар. Попробуйте снова",
    fileSizeError: "Размер файла должен быть менее 1 МБ",
  },

  // Task messages
  tasks: {
    createSuccess: "Задача успешно создана",
    createFailed: "Ошибка создания задачи",
    updateSuccess: "Задача успешно обновлена",
    updateFailed: "Не удалось обновить задачу",
    deleteSuccess: "Задача успешно удалена",
    deleteFailed: "Не удалось удалить задачу",
    statusUpdated: "Статус задачи обновлен",
    statusUpdateFailed: "Не удалось обновить статус задачи",
    priorityUpdated: "Приоритет задачи обновлен",
    priorityUpdateFailed: "Не удалось обновить приоритет задачи",
    titleUpdated: "Название задачи успешно обновлено",
    titleUpdateFailed: "Не удалось обновить название задачи",
    descriptionUpdated: "Описание задачи успешно обновлено",
    descriptionUpdateFailed: "Не удалось обновить описание задачи",
    assigneesUpdated: "Исполнители задачи обновлены",
    assigneesUpdateFailed: "Не удалось обновить исполнителей задачи",
    watchStatusUpdated: "Статус отслеживания обновлен",
    watchStatusUpdateFailed: "Не удалось обновить статус отслеживания",
    archived: "Задача заархивирована",
    unarchived: "Задача разархивирована",
    archiveUpdateFailed: "Не удалось обновить статус архива",
    addedToWatchers: "Добавлено в наблюдатели",
    removedFromWatchers: "Удалено из наблюдателей",
  },

  // Subtask messages
  subtasks: {
    createSuccess: "Подзадача успешно создана",
    createFailed: "Не удалось создать подзадачу",
    updateSuccess: "Подзадача успешно обновлена",
    updateFailed: "Не удалось обновить подзадачу",
  },

  // Comment and Response messages
  comments: {
    addSuccess: "Комментарий успешно добавлен",
    addFailed: "Не удалось добавить комментарий",
    responseAddSuccess: "Ответ успешно добавлен",
    responseAddFailed: "Не удалось добавить ответ",
    reactionAddSuccess: "Реакция успешно добавлена",
    reactionAddFailed: "Не удалось добавить реакцию",
    contentRequired: "Добавьте текст или прикрепите файл",
    voiceMessageAdded: "Голосовое сообщение добавлено",
    voiceMessageFailed: "Не удалось загрузить голосовое сообщение",
  },

  // File upload messages
  files: {
    uploadSuccess: "Файл успешно загружен",
    uploadFailed: "Не удалось загрузить файл",
    fileSizeError: "Файл превышает лимит в 50 МБ",
    fileTypeError: "Неподдерживаемый тип файла",
  },

  // Audio recording messages
  audio: {
    recordingStarted: "Запись началась...",
    recordingStopped: "Запись остановлена",
    recordingFailed: "Не удалось начать запись. Проверьте подключение микрофона",
    microphoneAccessDenied: "Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера",
    microphoneNotFound: "Микрофон не найден. Подключите микрофон и попробуйте снова",
    microphoneBusy: "Микрофон занят другим приложением. Закройте другие приложения и попробуйте снова",
    microphoneNotSupported: "Микрофон не поддерживает требуемые настройки",
    securityError: "Запись аудио заблокирована по соображениям безопасности. Используйте HTTPS соединение",
    browserNotSupported: "Ваш браузер не поддерживает запись аудио",
  },

  // Project messages
  projects: {
    createSuccess: "Проект успешно создан",
    createFailed: "Не удалось создать проект",
    updateSuccess: "Проект успешно обновлен",
    updateFailed: "Не удалось обновить проект",
    deleteSuccess: "Проект успешно удален",
    deleteFailed: "Не удалось удалить проект",
    archived: "Проект заархивирован",
    unarchived: "Проект разархивирован",
    archiveUpdateFailed: "Не удалось обновить статус архива проекта",
    membersAddSuccess: "Участники успешно добавлены",
    membersAddFailed: "Не удалось добавить участников",
    memberRemoveSuccess: "Участник успешно удален",
    memberRemoveFailed: "Не удалось удалить участника",
  },

  // Workspace messages
  workspaces: {
    createSuccess: "Рабочая область успешно создана",
    createFailed: "Не удалось создать рабочую область",
    updateSuccess: "Рабочая область успешно обновлена",
    updateFailed: "Не удалось обновить рабочую область",
    deleteSuccess: "Рабочая область успешно удалена",
    deleteFailed: "Не удалось удалить рабочую область",
    joinSuccess: "Вы успешно присоединились к рабочей области",
    joinFailed: "Не удалось присоединиться к рабочей области",
    inviteSuccess: "Приглашение успешно отправлено",
    inviteFailed: "Не удалось отправить приглашение",
    inviteLinkCopied: "Ссылка приглашения скопирована в буфер обмена",
    inviteDeclined: "Приглашение отклонено",
    ownershipTransferred: "Владение рабочей областью успешно передано",
    ownershipTransferFailed: "Не удалось передать владение рабочей областью",
    selectMemberError: "Пожалуйста, выберите участника для передачи владения",
    workspaceNotSelected: "Рабочая область не выбрана",
  },

  // Member management messages
  members: {
    roleUpdateSuccess: "Роль пользователя успешно изменена",
    roleUpdateFailed: "Ошибка изменения роли",
    removeSuccess: "Участник успешно удален",
    removeFailed: "Не удалось удалить участника",
  },

  // Notification messages
  notifications: {
    markAllReadSuccess: "Все уведомления отмечены как прочитанные",
    markAllReadFailed: "Произошла ошибка при отметке уведомлений",
    markReadSuccess: "Уведомление отмечено как прочитанное",
    markReadFailed: "Произошла ошибка при отметке уведомления",
  },

  // Settings messages
  settings: {
    saveSuccess: "Настройки успешно сохранены",
    saveFailed: "Не удалось сохранить настройки",
  },

  // General error messages
  errors: {
    networkError: "Ошибка сети. Проверьте подключение к интернету",
    serverError: "Ошибка сервера. Попробуйте позже",
    unknownError: "Произошла неизвестная ошибка",
    unauthorized: "Нет доступа",
    notFound: "Не найдено",
    validationError: "Ошибка валидации данных",
  },

  // Success messages
  success: {
    operationCompleted: "Операция успешно выполнена",
    changesSaved: "Изменения сохранены",
    actionCompleted: "Действие выполнено",
  },
};

// Helper function to get nested message
export const getToastMessage = (path: string): string => {
  const keys = path.split('.');
  let message: any = toastMessages;
  
  for (const key of keys) {
    if (message && typeof message === 'object' && key in message) {
      message = message[key];
    } else {
      return 'Сообщение не найдено';
    }
  }
  
  return typeof message === 'string' ? message : 'Неверный путь к сообщению';
};
