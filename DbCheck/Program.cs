using Npgsql;
Console.OutputEncoding = System.Text.Encoding.UTF8;
var cs = "Host=ep-delicate-mountain-ay52ojqv.c-5.us-east-2.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_tLB2MOKfZj7n;SSL Mode=Require;Trust Server Certificate=true";
await using var conn = new NpgsqlConnection(cs);
await conn.OpenAsync();

// Delete ALL existing advertisements (all duplicates + corrupted)
await using (var cmd = new NpgsqlCommand(@"DELETE FROM ""Advertisements""", conn))
{
    var deleted = await cmd.ExecuteNonQueryAsync();
    Console.WriteLine($"Deleted {deleted} advertisement rows.");
}

// Verify
await using (var cmd2 = new NpgsqlCommand(@"SELECT COUNT(*) FROM ""Advertisements""", conn))
{
    var count = await cmd2.ExecuteScalarAsync();
    Console.WriteLine($"Advertisements remaining: {count}");
}
