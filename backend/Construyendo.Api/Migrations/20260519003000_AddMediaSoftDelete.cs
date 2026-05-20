using System;
using Construyendo.Api.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Construyendo.Api.Migrations;

[Migration("20260519003000_AddMediaSoftDelete")]
[DbContext(typeof(AppDbContext))]
public partial class AddMediaSoftDelete : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "DeletedAt",
            schema: "public",
            table: "MediaAssets",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_MediaAssets_DeletedAt",
            schema: "public",
            table: "MediaAssets",
            column: "DeletedAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_MediaAssets_DeletedAt",
            schema: "public",
            table: "MediaAssets");

        migrationBuilder.DropColumn(
            name: "DeletedAt",
            schema: "public",
            table: "MediaAssets");
    }
}
