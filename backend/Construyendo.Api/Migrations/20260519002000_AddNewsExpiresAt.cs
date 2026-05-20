using System;
using Construyendo.Api.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Construyendo.Api.Migrations;

[Migration("20260519002000_AddNewsExpiresAt")]
[DbContext(typeof(AppDbContext))]
public partial class AddNewsExpiresAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "ExpiresAt",
            schema: "public",
            table: "NewsArticles",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_NewsArticles_PublishedAt",
            schema: "public",
            table: "NewsArticles",
            column: "PublishedAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_NewsArticles_PublishedAt",
            schema: "public",
            table: "NewsArticles");

        migrationBuilder.DropColumn(
            name: "ExpiresAt",
            schema: "public",
            table: "NewsArticles");
    }
}
