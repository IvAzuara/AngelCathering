# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar proyectos y restaurar dependencias
COPY ["AngelCathering.Models/AngelCathering.Models.csproj", "AngelCathering.Models/"]
COPY ["AngelCathering.Data/AngelCathering.Data.csproj", "AngelCathering.Data/"]
COPY ["AngelCathering.Repository/AngelCathering.Repository.csproj", "AngelCathering.Repository/"]
COPY ["AngelCathering.Api/AngelCathering.Api.csproj", "AngelCathering.Api/"]
COPY ["AngelCathering.slnx", "./"]

RUN dotnet restore "AngelCathering.Api/AngelCathering.Api.csproj"

# Copiar el resto del código y compilar
COPY . .
WORKDIR /src/AngelCathering.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "AngelCathering.Api.dll"]
