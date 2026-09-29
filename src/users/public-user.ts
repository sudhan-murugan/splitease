import { User } from './entities/user.entity';

// The user fields that are safe to embed in other resources' responses
export type PublicUser = Pick<User, 'id' | 'name' | 'email'>;

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}
