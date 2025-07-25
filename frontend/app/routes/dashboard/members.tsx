import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/shared/no-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetWorkspaceDetailsQuery } from "@/hooks/use-workspace";
import { useWorkspaceSearchParamId } from "@/hooks/use-workspace-id";
import { getRoleRussian } from "@/lib/translations";
import type { Workspace } from "@/types";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Workspace Members" },
    { name: "description", content: "Workspace Members to TaskHub!" },
  ];
}

const WorkspaceMembers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const workspaceId = useWorkspaceSearchParamId();
  const navigate = useNavigate();

  const { data, isPending } = useGetWorkspaceDetailsQuery(workspaceId!) as {
    data: Workspace;
    isPending: boolean;
  };

  // Keep state and URL in sync
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    params.search = searchQuery;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // If the URL changes externally, update state
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (isPending) {
    return <Loader message="Загрузка участников" />;
  }

  if (!workspaceId || !data) {
    return (
      <NoDataFound
        title="Рабочее пространство не выбрано"
        description="Пожалуйста, выберите рабочее пространство для просмотра архивных элементов или вернитесь на главную страницу."
        buttonText="Назад"
        buttonOnClick={() => navigate(-1)}
      />
    );
  }

  const { members } = data;

  // Filter members based on search query
  const filteredMembers = members.filter(
    (member) =>
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-3xl font-bold">Участники рабочей области</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/3">
          <Input
            placeholder="Поиск участников..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Вид Списка</TabsTrigger>
          <TabsTrigger value="grid">Вид Сетки</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Участники</CardTitle>
              <CardDescription>
                {filteredMembers.length} Участники найдены
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <div
                    key={member.user._id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-3"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="bg-gray-500">
                        <AvatarImage src={member.user.profilePicture} />
                        <AvatarFallback>
                          {member.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-11 md:ml-0">
                      <Badge
                        variant={
                          ["admin", "owner"].includes(member.role)
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {getRoleRussian(member.role || "member")}
                      </Badge>

                      <Badge variant="outline">{data.name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.user._id}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4 bg-gray-500">
                    <AvatarImage src={member.user.profilePicture} />
                    <AvatarFallback>
                      {member.user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold">{member.user.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {member.user.email}
                  </p>
                  <Badge
                    variant={
                      ["admin", "owner"].includes(member.role)
                        ? "destructive"
                        : "secondary"
                    }
                    className="mt-2 capitalize"
                  >
                    {getRoleRussian(member.role || "member")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkspaceMembers;
