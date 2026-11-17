FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/TreeTask.Api/TreeTask.Api.csproj src/TreeTask.Api/
RUN dotnet restore src/TreeTask.Api/TreeTask.Api.csproj
COPY src/ src/
RUN dotnet publish src/TreeTask.Api/TreeTask.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
ENV ConnectionStrings__Default="Data Source=/data/treetask.db"
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "TreeTask.Api.dll"]
