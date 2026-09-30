import { ApiProperty } from '@nestjs/swagger';
import { PublicUser } from '../../users/public-user';
import { GroupRole } from '../entities/group-member.entity';

// Response shapes for the groups endpoints

export class GroupSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Goa Trip' })
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    enum: GroupRole,
    description: "The caller's role in this group",
  })
  role!: GroupRole;
}

export class GroupMemberView extends PublicUser {
  @ApiProperty({ enum: GroupRole })
  role!: GroupRole;
}

export class GroupDetails {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Goa Trip' })
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: PublicUser })
  createdBy!: PublicUser;

  @ApiProperty({ type: [GroupMemberView] })
  members!: GroupMemberView[];
}
