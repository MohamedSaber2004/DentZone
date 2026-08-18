using Npgsql;
var connStr = "Host=ep-delicate-mountain-ay52ojqv.c-5.us-east-2.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_tLB2MOKfZj7n;SSL Mode=Require;Trust Server Certificate=true";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();
Console.WriteLine("=== CATEGORIES ===");
await using (var cmd = new NpgsqlCommand("SELECT slug, name_en, name_ar FROM categories LIMIT 6", conn))
await using (var r = await cmd.ExecuteReaderAsync())
  while (await r.ReadAsync()) Console.WriteLine("{0} | EN:{1} | AR:{2}", r[0], r[1], r[2]);
Console.WriteLine("=== VENDORS ===");
await using (var cmd2 = new NpgsqlCommand("SELECT slug, name_en, name_ar FROM vendors LIMIT 4", conn))
await using (var r2 = await cmd2.ExecuteReaderAsync())
  while (await r2.ReadAsync()) Console.WriteLine("{0} | EN:{1} | AR:{2}", r2[0], r2[1], r2[2]);
Console.WriteLine("=== ADVERTISEMENTS ===");
await using (var cmd3 = new NpgsqlCommand("SELECT title_en, title_ar, eyebrow_en, eyebrow_ar FROM advertisements LIMIT 3", conn))
await using (var r3 = await cmd3.ExecuteReaderAsync())
  while (await r3.ReadAsync()) Console.WriteLine("EN:{0} | AR:{1} | EyeEn:{2} | EyeAr:{3}", r3[0], r3[1], r3[2], r3[3]);
