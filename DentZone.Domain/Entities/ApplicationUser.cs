using DentZone.Domain.Common.Interfaces;
using DentZone.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace DentZone.Domain.Entities
{
    public class ApplicationUser : IdentityUser<Guid>, IBaseEntity<Guid>
    {
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public DateTime? DeletedAt { get; private set; }
        public string CreatedBy { get; private set; } = string.Empty;
        public string? UpdatedBy { get; private set; }
        public string? DeletedBy { get; private set; }
        public bool IsDeleted { get; private set; }
        public bool IsActive { get; private set; }

        public string FullName { get; private set; } = null!;
        public DateTime? BirthDate { get; private set; }
        public string? ProfilePictureName { get; private set; }
        public string? PasswordResetToken { get; private set; }
        public DateTime? PasswordResetTokenExpiry { get; private set; }
        public LanguageCode Language { get; private set; }
        public UserType UserType { get; private set; } = UserType.Doctor;

        public void MarkAsCreated(string createdBy)
        {
            CreatedAt = DateTime.Now;
            CreatedBy = createdBy;
            IsActive = true;
            IsDeleted = false;
        }

        public void MarkAsUpdated(string updatedBy)
        {
            UpdatedAt = DateTime.Now;
            UpdatedBy = updatedBy;
        }

        public void MarkAsDeleted(string deletedBy)
        {
            IsDeleted = true;
            IsActive = false;
            DeletedAt = DateTime.Now;
            DeletedBy = deletedBy;
        }

        public void Activate(string updatedBy)
        {
            IsActive = true;
            IsDeleted = false;
            MarkAsUpdated(updatedBy);
        }

        public void Deactivate(string updatedBy)
        {
            IsActive = false;
            MarkAsUpdated(updatedBy);
        }

        public void UpdateProfile(string fullName, DateTime? birthDate, string? profilePictureName, string updatedBy)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full name cannot be empty.", nameof(fullName));

            if (birthDate.HasValue && birthDate.Value > DateTime.Now)
                throw new ArgumentException("Birth date cannot be in the future.", nameof(birthDate));

            FullName = fullName;
            BirthDate = birthDate;
            ProfilePictureName = profilePictureName;
            MarkAsUpdated(updatedBy);
        }

        public void SetLanguage(LanguageCode language, string updatedBy)
        {
            Language = language;
            MarkAsUpdated(updatedBy);
        }

        public void SetUserType(UserType userType, string updatedBy)
        {
            UserType = userType;
            MarkAsUpdated(updatedBy);
        }

        public void RequestPasswordReset(string token, DateTime expiry)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new ArgumentException("Reset token cannot be empty.", nameof(token));

            if (expiry <= DateTime.Now)
                throw new ArgumentException("Reset token expiry must be in the future.", nameof(expiry));

            PasswordResetToken = token;
            PasswordResetTokenExpiry = expiry;
        }

        public bool ValidatePasswordResetToken(string token)
        {
            return !string.IsNullOrWhiteSpace(token)
                && PasswordResetToken == token
                && PasswordResetTokenExpiry.HasValue
                && PasswordResetTokenExpiry.Value > DateTime.Now;
        }

        public void ClearPasswordResetToken()
        {
            PasswordResetToken = null;
            PasswordResetTokenExpiry = null;
        }
    }
}