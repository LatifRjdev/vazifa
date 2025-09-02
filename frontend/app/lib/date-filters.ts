import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';

export type DateFilterPeriod = 'today' | 'week' | 'month' | '6months' | 'year' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export function getDateRangeForPeriod(period: DateFilterPeriod, customRange?: { from?: Date; to?: Date }): DateRange {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now)
      };

    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }), // Понедельник как начало недели
        to: endOfWeek(now, { weekStartsOn: 1 })
      };

    case 'month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      };

    case '6months':
      return {
        from: startOfDay(subMonths(now, 6)),
        to: endOfDay(now)
      };

    case 'year':
      return {
        from: startOfYear(now),
        to: endOfYear(now)
      };

    case 'custom':
      return {
        from: customRange?.from || startOfDay(subDays(now, 30)),
        to: customRange?.to || endOfDay(now)
      };

    default:
      return {
        from: startOfDay(subDays(now, 30)),
        to: endOfDay(now)
      };
  }
}

export function getPeriodLabel(period: DateFilterPeriod): string {
  switch (period) {
    case 'today':
      return 'За сегодня';
    case 'week':
      return 'За неделю';
    case 'month':
      return 'За месяц';
    case '6months':
      return 'За 6 месяцев';
    case 'year':
      return 'За год';
    case 'custom':
      return 'Произвольный период';
    default:
      return 'Все время';
  }
}

export function filterTasksByDateRange(tasks: any[], dateRange: DateRange, dateField: string = 'createdAt'): any[] {
  return tasks.filter(task => {
    const taskDate = new Date(task[dateField]);
    return taskDate >= dateRange.from && taskDate <= dateRange.to;
  });
}

export function getTasksCountByPeriod(tasks: any[], period: DateFilterPeriod, dateField: string = 'createdAt'): number {
  const dateRange = getDateRangeForPeriod(period);
  return filterTasksByDateRange(tasks, dateRange, dateField).length;
}
