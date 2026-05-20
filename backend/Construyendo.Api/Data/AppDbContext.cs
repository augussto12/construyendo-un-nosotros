using Construyendo.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<NewsCategory> NewsCategories => Set<NewsCategory>();
    public DbSet<NewsTag> NewsTags => Set<NewsTag>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<NewsImage> NewsImages => Set<NewsImage>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("public");

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(user => user.DisplayName).HasMaxLength(160).IsRequired();
            entity.Property(user => user.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        });

        modelBuilder.Entity<NewsArticle>(entity =>
        {
            entity.HasIndex(article => article.Slug).IsUnique();
            entity.HasIndex(article => article.Status);
            entity.HasIndex(article => article.PublishedAt);
            entity.HasIndex(article => new { article.IsFeatured, article.FeaturedOrder });
            entity.Property(article => article.Title).HasMaxLength(220).IsRequired();
            entity.Property(article => article.Slug).HasMaxLength(240).IsRequired();
            entity.Property(article => article.Excerpt).HasMaxLength(600).IsRequired();
            entity.Property(article => article.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(article => article.AuthorName).HasMaxLength(160);
            entity.Property(article => article.VideoProvider).HasMaxLength(32);
            entity.Property(article => article.VideoUrl).HasMaxLength(1000);
            entity.Property(article => article.SourceUrl).HasMaxLength(1000);
            entity.Property(article => article.SeoTitle).HasMaxLength(220);
            entity.Property(article => article.SeoDescription).HasMaxLength(320);

            entity
                .HasOne(article => article.MainImage)
                .WithMany(media => media.MainImageNewsArticles)
                .HasForeignKey(article => article.MainImageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(article => article.OgImage)
                .WithMany(media => media.OgImageNewsArticles)
                .HasForeignKey(article => article.OgImageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(article => article.CreatedBy)
                .WithMany(user => user.CreatedNewsArticles)
                .HasForeignKey(article => article.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(article => article.UpdatedBy)
                .WithMany(user => user.UpdatedNewsArticles)
                .HasForeignKey(article => article.UpdatedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<NewsCategory>(entity =>
        {
            entity.HasIndex(category => category.Slug).IsUnique();
            entity.Property(category => category.Name).HasMaxLength(140).IsRequired();
            entity.Property(category => category.Slug).HasMaxLength(160).IsRequired();
            entity.Property(category => category.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<NewsTag>(entity =>
        {
            entity.HasIndex(tag => tag.Slug).IsUnique();
            entity.Property(tag => tag.Name).HasMaxLength(100).IsRequired();
            entity.Property(tag => tag.Slug).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.Property(media => media.FileName).HasMaxLength(260).IsRequired();
            entity.Property(media => media.OriginalFileName).HasMaxLength(260).IsRequired();
            entity.Property(media => media.Url).HasMaxLength(1000).IsRequired();
            entity.Property(media => media.StoragePath).HasMaxLength(1000).IsRequired();
            entity.Property(media => media.MimeType).HasMaxLength(120).IsRequired();
            entity.Property(media => media.Extension).HasMaxLength(16).IsRequired();
            entity.Property(media => media.AltText).HasMaxLength(250);
            entity.HasIndex(media => media.DeletedAt);

            entity
                .HasOne(media => media.UploadedBy)
                .WithMany(user => user.UploadedMediaAssets)
                .HasForeignKey(media => media.UploadedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<NewsImage>(entity =>
        {
            entity.HasIndex(image => new { image.NewsArticleId, image.SortOrder });
            entity.Property(image => image.Caption).HasMaxLength(300);
            entity.Property(image => image.AltText).HasMaxLength(250);

            entity
                .HasOne(image => image.NewsArticle)
                .WithMany(article => article.GalleryImages)
                .HasForeignKey(image => image.NewsArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(image => image.MediaAsset)
                .WithMany(media => media.NewsImages)
                .HasForeignKey(image => image.MediaAssetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SiteSetting>(entity =>
        {
            entity.HasIndex(setting => setting.Key).IsUnique();
            entity.Property(setting => setting.Key).HasMaxLength(120).IsRequired();
            entity.Property(setting => setting.Value).HasMaxLength(2000).IsRequired();
            entity.Property(setting => setting.Type).HasMaxLength(40).IsRequired();
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(log => log.Action).HasMaxLength(120).IsRequired();
            entity.Property(log => log.EntityName).HasMaxLength(160).IsRequired();

            entity
                .HasOne(log => log.User)
                .WithMany(user => user.AuditLogs)
                .HasForeignKey(log => log.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
