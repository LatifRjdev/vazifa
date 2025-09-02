import { Button } from "@/components/ui/button";
import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { CalendarCheck, CircleCheckBig, List, Users, Smartphone, Download } from "lucide-react";

export function meta() {
  return [
    { title: "Vazifa: Cloud-based task management platform" },
    { name: "description", content: "Welcome to Vazifa!" },
  ];
}

const Welcome = () => {
  return (
    <div className="flex flex-col  min-h-screen">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <header className="header">
          <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-md p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary-foreground"
                >
                  <path d="m3 17 2 2 4-4" />
                  <path d="m3 7 2 2 4-4" />
                  <path d="M13 6h8" />
                  <path d="M13 12h8" />
                  <path d="M13 18h8" />
                </svg>
              </div>
              <span className="font-bold text-xl hidden sm:inline-block">
                Vazifa
              </span>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4">
              <Link to="/sign-in">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link to="/sign-up">
                <Button>Начать</Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="flex flex-col justify-center space-y-8">
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-3xl font-bold text-pretty tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Делайте больше с{" "}
                    <span className="text-blue-600">Vazifa</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl text-pretty">
                    Современная платформа управления задачами, которая помогает командам
                    эффективно организовывать, отслеживать и выполнять работу.
                  </p>
                </motion.div>

                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link to="/sign-up">
                    <Button size="lg" className="px-8">
                      Попробуйте бесплатно
                    </Button>
                  </Link>
                  <Link to="#features">
                    <Button size="lg" variant="outline">
                      Посмотреть особенности
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row md:items-center gap-4 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center gap-1">
                    <CircleCheckBig className="size-4 text-primary" />
                    <span>Кредитная карта не требуется</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CircleCheckBig className="size-4 text-primary" />
                    <span>Доступен бесплатный план</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CircleCheckBig className="size-4 text-primary" />
                    <span>Отменить в любое время</span>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="mx-auto flex items-center justify-center lg:justify-end max-w-full overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg">
                  <img
                    alt="Vazifa Dashboard"
                    className="relative dark:hidden rounded-xl shadow-xl border object-cover w-full max-w-full"
                    src="/task-hub-dark.png"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <motion.div
            className="container px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Наши возможности
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-pretty">
                  Все необходимое для эффективного управления задачами
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Наши мощные функции помогают командам оставаться организованными
                  и выполнять проекты вовремя.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-12 lg:gap-16 mt-16">
              <motion.div
                className="flex flex-col items-center space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-blue-600/10 p-3 rounded-full">
                  <Users className="size-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Командное сотрудничество</h3>
                <p className="text-muted-foreground">
                  Эффективно работайте вместе со своей командой в общих рабочих пространствах
                  с обновлениями в режиме реального времени.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-blue-600/10 p-3 rounded-full">
                  <CalendarCheck className="size-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Управление задачами</h3>
                <p className="text-muted-foreground">
                  Организуйте задачи с указанием приоритетов, сроков выполнения, комментариев и визуально 
                  отслеживайте ход выполнения.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="bg-blue-600/10 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-blue-600"
                  >
                    <path d="M2 20h.01"></path>
                    <path d="M7 20v-4"></path>
                    <path d="M12 20v-8"></path>
                    <path d="M17 20V8"></path>
                    <path d="M22 4v16"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Отслеживание прогресса</h3>
                <p className="text-muted-foreground">
                  Визуализируйте ход выполнения проекта с помощью наглядных диаграмм и получайте 
                  представление о производительности команды.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <motion.div
            className="container px-4 md:px-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Как это работает
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Простой процесс, впечатляющие результаты
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Начните работу за считанные минуты и увидите повышение производительности команды
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-16">
              <motion.div
                className="relative flex flex-col items-center space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="absolute -top-10 text-6xl font-bold text-muted/20">
                  1
                </div>
                <div className="bg-blue-600/10 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-blue-600"
                  >
                    <rect
                      width="18"
                      height="11"
                      x="3"
                      y="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Завести аккаунт</h3>
                <p className="text-muted-foreground">
                  Зарегистрируйтесь бесплатно и создайте свое первое рабочее пространство за считанные секунды.
                </p>
              </motion.div>
              <motion.div
                className="relative flex flex-col items-center space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="absolute -top-10 text-6xl font-bold text-muted/20">
                  2
                </div>
                <div className="bg-blue-600/10 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-blue-600"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Пригласите свою команду</h3>
                <p className="text-muted-foreground">
                  Добавьте членов своей команды и начните сотрудничать прямо сейчас.
                </p>
              </motion.div>
              <motion.div
                className="relative flex flex-col items-center space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="absolute -top-10 text-6xl font-bold text-muted/20">
                  3
                </div>
                <div className="bg-blue-600/10 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-blue-600"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Делайте дела</h3>
                <p className="text-muted-foreground">
                  Создавайте проекты, назначайте задачи и отслеживайте 
                  прогресс в режиме реального времени.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Mobile App Section */}
        <section id="mobile-app" className="w-full py-12 md:py-24 lg:py-32">
          <motion.div
            className="container px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Мобильное приложение
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-pretty">
                  Vazifa теперь в вашем кармане
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Управляйте задачами и проектами где угодно с нашим мобильным приложением.
                  Полная синхронизация с веб-версией в режиме реального времени.
                </p>
              </div>
            </div>
            
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 mt-16 items-center">
              <motion.div
                className="flex flex-col space-y-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600/10 p-2 rounded-full">
                      <Smartphone className="size-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">Доступно на всех устройствах</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Нативные приложения для iOS и Android с полным функционалом веб-версии.
                    Работайте офлайн и синхронизируйтесь при подключении к интернету.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600/10 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-6 text-blue-600"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Синхронизация в реальном времени</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Все изменения мгновенно синхронизируются между мобильным приложением и веб-версией.
                    Начните работу на телефоне, продолжите на компьютере.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600/10 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-6 text-blue-600"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Push-уведомления</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Получайте мгновенные уведомления о новых задачах, комментариях и изменениях в проектах.
                    Никогда не пропустите важные обновления.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="flex items-center gap-2">
                    <Download className="size-5" />
                    Скачать для iOS
                  </Button>
                  <Button size="lg" variant="outline" className="flex items-center gap-2">
                    <Download className="size-5" />
                    Скачать для Android
                  </Button>
                </div>
              </motion.div>

              <motion.div
                className="flex justify-center lg:justify-end"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl">
                    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-xs">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">Мои задачи</h4>
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">3</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 border-2 border-blue-600 rounded"></div>
                            <span className="text-sm text-gray-700">Обновить дизайн</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <span className="text-sm text-gray-500 line-through">Написать отчет</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 border-2 border-orange-500 rounded"></div>
                            <span className="text-sm text-gray-700">Встреча с командой</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="w-full py-12 mb-20 md:py-24 lg:py-32 bg-blue-600">
        <motion.div
          className="container px-4 md:px-6 text-center max-w-screen-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter text-primary-foreground sm:text-4xl md:text-5xl">
                Готовы повысить производительность своей команды?
              </h2>
              <p className="mx-auto max-w-[700px] text-primary-foreground/80 text-sm md:text-xl text-pretty">
                Присоединяйтесь к тысячам команд, которые используют Vazifa чтобы вместе 
                добиться большего.
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/sign-up">
                <Button variant="secondary" size="lg">
                  Начни бесплатно
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  size="lg"
                >
                  Войти
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto  py-6 md:py-10 border-t">
        <div className="container px-4 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-md p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-primary-foreground"
                >
                  <path d="m3 17 2 2 4-4" />
                  <path d="m3 7 2 2 4-4" />
                  <path d="M13 6h8" />
                  <path d="M13 12h8" />
                  <path d="M13 18h8" />
                </svg>
              </div>
              <span className="font-bold text-lg">Vazifa</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Упростите управление задачами и совместную работу в команде.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Продукт</h3>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/#features" className="hover:text-foreground">
                    Функции
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Цены
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Варианты использования
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Дорожная карта
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Компания</h3>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-foreground">
                    О
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Карьера
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Блог
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Контакт
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Юридический</h3>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-foreground">
                    политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Условия использования
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Политика использования файлов cookie
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container px-4 mt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2025 Vazifa. Все права защищены.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link to="#" className="hover:text-foreground">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Link>
            <Link to="#" className="hover:text-foreground">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </Link>
            <Link to="#" className="hover:text-foreground">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
