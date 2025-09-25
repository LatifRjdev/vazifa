import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-context"

// Russian month names
const russianMonths = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// Russian day names (short)
const russianDaysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Tajik month names
const tajikMonths = [
  "Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
  "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"
];

// Tajik day names (short)
const tajikDaysShort = ["Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн", "Як"];

function RussianCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: any) {
  const { language } = useLanguage();
  const today = new Date();
  
  // Get localized month and day names based on current language
  const monthNames = language === 'ru' ? russianMonths : tajikMonths;
  const dayNames = language === 'ru' ? russianDaysShort : tajikDaysShort;

  // Custom formatters for Russian/Tajik localization
  const formatters = {
    formatCaption: (date: Date) => {
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${year}`;
    },
    formatWeekdayName: (date: Date) => {
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      return dayNames[dayIndex];
    }
  };

  return (
    <DayPicker
      locale={ru}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      formatters={formatters}
      modifiers={{
        today: today
      }}
      modifiersStyles={{
        today: {
          backgroundColor: 'hsl(var(--accent))',
          color: 'hsl(var(--accent-foreground))',
          fontWeight: 'bold',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '6px'
        }
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-bold border-2 border-primary",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...(props as any)}
    />
  )
}

export { RussianCalendar }
