import { redirect } from "react-router";

export async function loader() {
  // Перенаправляем на страницу my-tasks внутри dashboard
  return redirect("/dashboard/my-tasks");
}

export default function MyTasksRedirect() {
  return null;
}
