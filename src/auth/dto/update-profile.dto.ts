import { IsString, IsNotEmpty, IsOptional, Length, MaxLength, Matches, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isAllowedAvatarUrl } from '../avatar-url';

@ValidatorConstraint({ name: 'IsAvatarUrl', async: false })
export class IsAvatarUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (typeof url !== 'string') return false;
    return isAllowedAvatarUrl(url, process.env.AVATAR_URL_PREFIX);
  }
  defaultMessage(args: ValidationArguments) {
    return 'avatarUrl must be a valid HTTPS URL starting with AVATAR_URL_PREFIX';
  }
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 20)
  @Matches(/^[一-龥a-zA-Z0-9_\s·.\-]+$/, {
    message: '昵称只能包含中文、字母、数字和常见符号',
  })
  nickName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Validate(IsAvatarUrlConstraint)
  avatarUrl?: string;
}
