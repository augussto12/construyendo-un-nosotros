using System;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Construyendo.Api.Migrations;

[DbContext(typeof(AppDbContext))]
partial class AppDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasDefaultSchema("public")
            .HasAnnotation("ProductVersion", "8.0.0");

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("AdminUsers", "public");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(user => user.DisplayName).HasMaxLength(160).IsRequired();
            entity.Property(user => user.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        });

        modelBuilder.Entity<NewsArticle>(entity =>
        {
            entity.ToTable("NewsArticles", "public");
            entity.HasKey(article => article.Id);
            entity.HasIndex(article => article.Slug).IsUnique();
            entity.HasIndex(article => article.Status);
            entity.HasIndex(article => article.PublishedAt);
            entity.HasIndex(article => new { article.IsFeatured, article.FeaturedOrder });
            entity.Property(article => article.Title).HasMaxLength(220).IsRequired();
            entity.Property(article => article.Slug).HasMaxLength(240).IsRequired();
            entity.Property(article => article.Excerpt).HasMaxLength(600).IsRequired();
            entity.Property(article => article.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(article => article.ExpiresAt);
            entity.Property(article => article.AuthorName).HasMaxLength(160);
            entity.Property(article => article.VideoProvider).HasMaxLength(32);
            entity.Property(article => article.VideoUrl).HasMaxLength(1000);
            entity.Property(article => article.SourceUrl).HasMaxLength(1000);
            entity.Property(article => article.SeoTitle).HasMaxLength(220);
            entity.Property(article => article.SeoDescription).HasMaxLength(320);
        });

        modelBuilder.Entity<NewsCategory>(entity =>
        {
            entity.ToTable("NewsCategories", "public");
            entity.HasKey(category => category.Id);
            entity.HasIndex(category => category.Slug).IsUnique();
            entity.Property(category => category.Name).HasMaxLength(140).IsRequired();
            entity.Property(category => category.Slug).HasMaxLength(160).IsRequired();
            entity.Property(category => category.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<NewsTag>(entity =>
        {
            entity.ToTable("NewsTags", "public");
            entity.HasKey(tag => tag.Id);
            entity.HasIndex(tag => tag.Slug).IsUnique();
            entity.Property(tag => tag.Name).HasMaxLength(100).IsRequired();
            entity.Property(tag => tag.Slug).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.ToTable("MediaAssets", "public");
            entity.HasKey(media => media.Id);
            entity.Property(media => media.FileName).HasMaxLength(260).IsRequired();
            entity.Property(media => media.OriginalFileName).HasMaxLength(260).IsRequired();
            entity.Property(media => media.Url).HasMaxLength(1000).IsRequired();
            entity.Property(media => media.StoragePath).HasMaxLength(1000).IsRequired();
            entity.Property(media => media.MimeType).HasMaxLength(120).IsRequired();
            entity.Property(media => media.Extension).HasMaxLength(16).IsRequired();
            entity.Property(media => media.AltText).HasMaxLength(250);
            entity.Property(media => media.DeletedAt);
            entity.HasIndex(media => media.DeletedAt);
        });

        modelBuilder.Entity<NewsImage>(entity =>
        {
            entity.ToTable("NewsImages", "public");
            entity.HasKey(image => image.Id);
            entity.HasIndex(image => new { image.NewsArticleId, image.SortOrder });
            entity.Property(image => image.Caption).HasMaxLength(300);
            entity.Property(image => image.AltText).HasMaxLength(250);
        });

        modelBuilder.Entity<SiteSetting>(entity =>
        {
            entity.ToTable("SiteSettings", "public");
            entity.HasKey(setting => setting.Id);
            entity.HasIndex(setting => setting.Key).IsUnique();
            entity.Property(setting => setting.Key).HasMaxLength(120).IsRequired();
            entity.Property(setting => setting.Value).HasMaxLength(2000).IsRequired();
            entity.Property(setting => setting.Type).HasMaxLength(40).IsRequired();
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs", "public");
            entity.HasKey(log => log.Id);
            entity.Property(log => log.Action).HasMaxLength(120).IsRequired();
            entity.Property(log => log.EntityName).HasMaxLength(160).IsRequired();
        });
    }
}
