import { Transform } from 'class-transformer';
import { IsEmail, IsUUID, MaxLength, ValidateIf } from 'class-validator';

// Identify the user to add by exactly one of email or userId
// (the "not both" rule is enforced in GroupsService.addMember).
export class AddMemberDto {
  // Required unless userId is given; normalized to match RegisterDto
  @ValidateIf((o: AddMemberDto) => o.userId === undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email?: string;

  // Required unless email is given
  @ValidateIf((o: AddMemberDto) => o.email === undefined)
  @IsUUID()
  userId?: string;
}
