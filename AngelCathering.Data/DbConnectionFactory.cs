using System.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace AngelCathering.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
    NpgsqlDataSource DataSource { get; }
}

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly NpgsqlDataSource _dataSource;

    public DbConnectionFactory(IConfiguration configuration)
    {
        var rawConn = Environment.GetEnvironmentVariable("CONNECTION_STRING")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'CONNECTION_STRING' ni 'DefaultConnection'.");

        var builder = new NpgsqlConnectionStringBuilder(rawConn)
        {
            // Ajustes esenciales para Supabase Connection Pooler (Supavisor en puerto 6543 / 5432)
            Timeout = 30,
            CommandTimeout = 30,
            KeepAlive = 15,
            TcpKeepAlive = true,
            Pooling = true,
            MaxPoolSize = 20,
            MinPoolSize = 0,
            ConnectionIdleLifetime = 15,
            ConnectionPruningInterval = 10,
            // Requerido para transaction pooler (puerto 6543) para evitar bloqueos por prepared statements
            Multiplexing = false
        };

        var dataSourceBuilder = new NpgsqlDataSourceBuilder(builder.ConnectionString);
        _dataSource = dataSourceBuilder.Build();
    }

    public NpgsqlDataSource DataSource => _dataSource;

    public IDbConnection CreateConnection()
    {
        return _dataSource.CreateConnection();
    }
}
