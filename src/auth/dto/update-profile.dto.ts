import { IsString, IsOptional, Length, MaxLength, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsAvatarUrl', async: false })
export class IsAvatarUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (url === '') return true; // allow keeping existing value when empty
    if (!url.startsWith('https://')) return false;
    const prefix = process.env.AVATAR_URL_PREFIX || '';
    if (!prefix || !url.startsWith(prefix)) return false;
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    return 'avatarUrl must be a valid HTTPS URL starting with AVATAR_URL_PREFIX';
  }
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 20)
  nickName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Validate(IsAvatarUrlConstraint)
  avatarUrl?: string;
}
