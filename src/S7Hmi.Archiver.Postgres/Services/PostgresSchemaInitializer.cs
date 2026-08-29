using Dapper;
using Npgsql;

namespace S7Hmi.Archiver.Postgres.Services;

/// <summary>
/// Инициализатор таблиц и структуры базы данных PostgreSQL / TimescaleDB
/// </summary>
public static class PostgresSchemaInitializer
{
    public static async Task InitializeAsync(string connectionString, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        // 1. Попытка включения TimescaleDB если доступно
        try
        {
            await connection.ExecuteAsync("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;");
        }
        catch
        {
            // TimescaleDB extension might not be installed; fallback to standard PostgreSQL partition/index
        }

        // 2. Таблица определений тегов
        var createTagsSql = @"
        CREATE TABLE IF NOT EXISTS tag_definitions (
            id VARCHAR(128) PRIMARY KEY,
            plc_id VARCHAR(64) NOT NULL,
            name VARCHAR(128) NOT NULL,
            description TEXT,
            address VARCHAR(64) NOT NULL,
            data_type VARCHAR(32) NOT NULL,
            unit VARCHAR(32),
            min_value DOUBLE PRECISION,
            max_value DOUBLE PRECISION,
            archive_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );";
        await connection.ExecuteAsync(createTagsSql);

        // 3. Таблица истории значений тегов (Гипертаблица трендов)
        var createHistorySql = @"
        CREATE TABLE IF NOT EXISTS tag_history (
            timestamp TIMESTAMPTZ NOT NULL,
            tag_id VARCHAR(128) NOT NULL,
            value_numeric DOUBLE PRECISION,
            value_text TEXT,
            quality INT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tag_history_tag_ts ON tag_history (tag_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_tag_history_ts ON tag_history (timestamp DESC);
        ";
        await connection.ExecuteAsync(createHistorySql);

        // Попытка сделать hypertable
        try
        {
            await connection.ExecuteAsync("SELECT create_hypertable('tag_history', 'timestamp', if_not_exists => TRUE);");
        }
        catch
        {
            // Already a hypertable or standard postgres table
        }

        // 4. Журнал аварийных событий
        var createAlarmsSql = @"
        CREATE TABLE IF NOT EXISTS alarm_history (
            id BIGSERIAL PRIMARY KEY,
            alarm_id VARCHAR(64) NOT NULL,
            tag_id VARCHAR(128) NOT NULL,
            severity INT NOT NULL,
            state INT NOT NULL,
            message TEXT NOT NULL,
            trigger_value DOUBLE PRECISION NOT NULL,
            setpoint DOUBLE PRECISION NOT NULL,
            active_timestamp TIMESTAMPTZ NOT NULL,
            ack_timestamp TIMESTAMPTZ,
            cleared_timestamp TIMESTAMPTZ,
            ack_by VARCHAR(64)
        );
        CREATE INDEX IF NOT EXISTS idx_alarm_history_ts ON alarm_history (active_timestamp DESC);
        ";
        await connection.ExecuteAsync(createAlarmsSql);
    }
}
