import { ApiProperty } from '@nestjs/swagger';
import { User } from './entities/user.entity';

// The user fields that are safe to embed in other resources' responses.
// A class (not a type) so Swagger can describe it.
export class PublicUser {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Alice' })
  name!: string;

  @ApiProperty({ example: 'alice@example.com' })
  email!: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}
