FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY TaskBoard.Api/TaskBoard.Api.csproj TaskBoard.Api/
RUN dotnet restore TaskBoard.Api/TaskBoard.Api.csproj
COPY TaskBoard.Api/ TaskBoard.Api/
RUN dotnet publish TaskBoard.Api/TaskBoard.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "TaskBoard.Api.dll"]
