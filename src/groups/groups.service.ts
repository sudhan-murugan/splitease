import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PublicUser, toPublicUser } from '../users/public-user';
import { UsersService } from '../users/users.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMember, GroupRole } from './entities/group-member.entity';
import { Group } from './entities/group.entity';

// Postgres error code for unique constraint violations
const PG_UNIQUE_VIOLATION = '23505';

export interface GroupSummary {
  id: string;
  name: string;
  createdAt: Date;
  role: GroupRole; // the caller's role in this group
}

export interface GroupDetails {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: PublicUser;
  members: (PublicUser & { role: GroupRole })[];
}

@Injectable()
export class GroupsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
    private readonly usersService: UsersService,
  ) {}

  // Creates the group and the creator's admin membership atomically
  async create(dto: CreateGroupDto, creator: User): Promise<GroupDetails> {
    const groupId = await this.dataSource.transaction(async (manager) => {
      const group = await manager.save(
        manager.create(Group, { name: dto.name, createdBy: creator }),
      );
      await manager.save(
        manager.create(GroupMember, {
          groupId: group.id,
          userId: creator.id,
          role: GroupRole.Admin,
        }),
      );
      return group.id;
    });
    return this.findOneForUser(groupId, creator.id);
  }

  // Groups the user belongs to, newest first
  async findAllForUser(userId: string): Promise<GroupSummary[]> {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: { group: true },
      order: { group: { createdAt: 'DESC' } },
    });
    return memberships.map(({ group, role }) => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      role,
    }));
  }

  // 404 if the group doesn't exist, 403 if the user isn't a member
  async findOneForUser(groupId: string, userId: string): Promise<GroupDetails> {
    const group = await this.groupsRepo.findOne({
      where: { id: groupId },
      relations: { createdBy: true, members: { user: true } },
      order: { members: { user: { name: 'ASC' } } },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      createdBy: toPublicUser(group.createdBy),
      members: group.members.map((m) => ({
        ...toPublicUser(m.user),
        role: m.role,
      })),
    };
  }

  // Only a group admin may add members; new members always get the 'member' role
  async addMember(
    groupId: string,
    dto: AddMemberDto,
    requesterId: string,
  ): Promise<GroupDetails> {
    if (dto.email !== undefined && dto.userId !== undefined) {
      throw new BadRequestException('Provide either email or userId, not both');
    }

    if (!(await this.groupsRepo.existsBy({ id: groupId }))) {
      throw new NotFoundException('Group not found');
    }
    const requester = await this.membersRepo.findOneBy({
      groupId,
      userId: requesterId,
    });
    if (requester?.role !== GroupRole.Admin) {
      throw new ForbiddenException('Only group admins can add members');
    }

    const user = dto.userId
      ? await this.usersService.findById(dto.userId)
      : await this.usersService.findByEmail(dto.email!);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // insert (not save) so an existing membership is never silently overwritten
      await this.membersRepo.insert({
        groupId,
        userId: user.id,
        role: GroupRole.Member,
      });
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('User is already a member of this group');
      }
      throw err;
    }

    return this.findOneForUser(groupId, requesterId);
  }

  // Guard for group-scoped resources: 404 if the group doesn't exist,
  // 403 if the user isn't a member. One query on the happy path.
  async assertMember(groupId: string, userId: string): Promise<void> {
    if (await this.membersRepo.existsBy({ groupId, userId })) {
      return;
    }
    if (!(await this.groupsRepo.existsBy({ id: groupId }))) {
      throw new NotFoundException('Group not found');
    }
    throw new ForbiddenException('You are not a member of this group');
  }
}
