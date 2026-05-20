using System;
using Construyendo.Api.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Construyendo.Api.Migrations;

[Migration("20260519000000_InitialCreate")]
[DbContext(typeof(AppDbContext))]
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "public");

        migrationBuilder.CreateTable(
            name: "AdminUsers",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                DisplayName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                LastLoginAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AdminUsers", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "NewsCategories",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                Slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsCategories", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "NewsTags",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsTags", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "SiteSettings",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Key = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                Value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SiteSettings", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "AuditLogs",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: true),
                Action = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                EntityName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                MetadataJson = table.Column<string>(type: "text", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditLogs", x => x.Id);
                table.ForeignKey(
                    name: "FK_AuditLogs_AdminUsers_UserId",
                    column: x => x.UserId,
                    principalSchema: "public",
                    principalTable: "AdminUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "MediaAssets",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                OriginalFileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                Url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                StoragePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                MimeType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                Extension = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                Width = table.Column<int>(type: "integer", nullable: true),
                Height = table.Column<int>(type: "integer", nullable: true),
                AltText = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                UploadedById = table.Column<Guid>(type: "uuid", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MediaAssets", x => x.Id);
                table.ForeignKey(
                    name: "FK_MediaAssets_AdminUsers_UploadedById",
                    column: x => x.UploadedById,
                    principalSchema: "public",
                    principalTable: "AdminUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "NewsArticles",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(220)", maxLength: 220, nullable: false),
                Slug = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                Excerpt = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                ContentHtml = table.Column<string>(type: "text", nullable: false),
                Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                PublishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                ScheduledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                AuthorName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                MainImageId = table.Column<Guid>(type: "uuid", nullable: true),
                VideoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                VideoProvider = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                SourceUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                FeaturedOrder = table.Column<int>(type: "integer", nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                SeoTitle = table.Column<string>(type: "character varying(220)", maxLength: 220, nullable: true),
                SeoDescription = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                OgImageId = table.Column<Guid>(type: "uuid", nullable: true),
                CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                UpdatedById = table.Column<Guid>(type: "uuid", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsArticles", x => x.Id);
                table.ForeignKey(
                    name: "FK_NewsArticles_AdminUsers_CreatedById",
                    column: x => x.CreatedById,
                    principalSchema: "public",
                    principalTable: "AdminUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_NewsArticles_AdminUsers_UpdatedById",
                    column: x => x.UpdatedById,
                    principalSchema: "public",
                    principalTable: "AdminUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_NewsArticles_MediaAssets_MainImageId",
                    column: x => x.MainImageId,
                    principalSchema: "public",
                    principalTable: "MediaAssets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_NewsArticles_MediaAssets_OgImageId",
                    column: x => x.OgImageId,
                    principalSchema: "public",
                    principalTable: "MediaAssets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "NewsArticleNewsCategory",
            schema: "public",
            columns: table => new
            {
                CategoriesId = table.Column<Guid>(type: "uuid", nullable: false),
                NewsArticlesId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsArticleNewsCategory", x => new { x.CategoriesId, x.NewsArticlesId });
                table.ForeignKey(
                    name: "FK_NewsArticleNewsCategory_NewsArticles_NewsArticlesId",
                    column: x => x.NewsArticlesId,
                    principalSchema: "public",
                    principalTable: "NewsArticles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_NewsArticleNewsCategory_NewsCategories_CategoriesId",
                    column: x => x.CategoriesId,
                    principalSchema: "public",
                    principalTable: "NewsCategories",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "NewsArticleNewsTag",
            schema: "public",
            columns: table => new
            {
                NewsArticlesId = table.Column<Guid>(type: "uuid", nullable: false),
                TagsId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsArticleNewsTag", x => new { x.NewsArticlesId, x.TagsId });
                table.ForeignKey(
                    name: "FK_NewsArticleNewsTag_NewsArticles_NewsArticlesId",
                    column: x => x.NewsArticlesId,
                    principalSchema: "public",
                    principalTable: "NewsArticles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_NewsArticleNewsTag_NewsTags_TagsId",
                    column: x => x.TagsId,
                    principalSchema: "public",
                    principalTable: "NewsTags",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "NewsImages",
            schema: "public",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                NewsArticleId = table.Column<Guid>(type: "uuid", nullable: false),
                MediaAssetId = table.Column<Guid>(type: "uuid", nullable: false),
                Caption = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                AltText = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                IsMain = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsImages", x => x.Id);
                table.ForeignKey(
                    name: "FK_NewsImages_MediaAssets_MediaAssetId",
                    column: x => x.MediaAssetId,
                    principalSchema: "public",
                    principalTable: "MediaAssets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_NewsImages_NewsArticles_NewsArticleId",
                    column: x => x.NewsArticleId,
                    principalSchema: "public",
                    principalTable: "NewsArticles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_AdminUsers_Email", "AdminUsers", "Email", "public", unique: true);
        migrationBuilder.CreateIndex("IX_AuditLogs_UserId", "AuditLogs", "UserId", "public");
        migrationBuilder.CreateIndex("IX_MediaAssets_UploadedById", "MediaAssets", "UploadedById", "public");
        migrationBuilder.CreateIndex("IX_NewsArticleNewsCategory_NewsArticlesId", "NewsArticleNewsCategory", "NewsArticlesId", "public");
        migrationBuilder.CreateIndex("IX_NewsArticleNewsTag_TagsId", "NewsArticleNewsTag", "TagsId", "public");
        migrationBuilder.CreateIndex("IX_NewsArticles_CreatedById", "NewsArticles", "CreatedById", "public");
        migrationBuilder.CreateIndex("IX_NewsArticles_IsFeatured_FeaturedOrder", "NewsArticles", new[] { "IsFeatured", "FeaturedOrder" }, "public");
        migrationBuilder.CreateIndex("IX_NewsArticles_MainImageId", "NewsArticles", "MainImageId", "public");
        migrationBuilder.CreateIndex("IX_NewsArticles_OgImageId", "NewsArticles", "OgImageId", "public");
        migrationBuilder.CreateIndex("IX_NewsArticles_Slug", "NewsArticles", "Slug", "public", unique: true);
        migrationBuilder.CreateIndex("IX_NewsArticles_Status", "NewsArticles", "Status", "public");
        migrationBuilder.CreateIndex("IX_NewsArticles_UpdatedById", "NewsArticles", "UpdatedById", "public");
        migrationBuilder.CreateIndex("IX_NewsCategories_Slug", "NewsCategories", "Slug", "public", unique: true);
        migrationBuilder.CreateIndex("IX_NewsImages_MediaAssetId", "NewsImages", "MediaAssetId", "public");
        migrationBuilder.CreateIndex("IX_NewsImages_NewsArticleId_SortOrder", "NewsImages", new[] { "NewsArticleId", "SortOrder" }, "public");
        migrationBuilder.CreateIndex("IX_NewsTags_Slug", "NewsTags", "Slug", "public", unique: true);
        migrationBuilder.CreateIndex("IX_SiteSettings_Key", "SiteSettings", "Key", "public", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("AuditLogs", "public");
        migrationBuilder.DropTable("NewsArticleNewsCategory", "public");
        migrationBuilder.DropTable("NewsArticleNewsTag", "public");
        migrationBuilder.DropTable("NewsImages", "public");
        migrationBuilder.DropTable("SiteSettings", "public");
        migrationBuilder.DropTable("NewsCategories", "public");
        migrationBuilder.DropTable("NewsTags", "public");
        migrationBuilder.DropTable("NewsArticles", "public");
        migrationBuilder.DropTable("MediaAssets", "public");
        migrationBuilder.DropTable("AdminUsers", "public");
    }
}
