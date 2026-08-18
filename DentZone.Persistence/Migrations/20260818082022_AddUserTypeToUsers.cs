using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentZone.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTypeToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserType",
                schema: "public",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Doctor");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserType",
                schema: "public",
                table: "Users");
        }
    }
}
