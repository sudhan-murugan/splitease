import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDetails, GroupSummary, GroupsService } from './groups.service';

// Every route requires "Authorization: Bearer <token>"
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // POST /groups — 201 with the new group; the caller becomes its admin
  @Post()
  create(
    @Body() dto: CreateGroupDto,
    @Req() req: Request,
  ): Promise<GroupDetails> {
    return this.groupsService.create(dto, req.user as User);
  }

  // GET /groups — groups the caller belongs to
  @Get()
  findAll(@Req() req: Request): Promise<GroupSummary[]> {
    return this.groupsService.findAllForUser((req.user as User).id);
  }

  // GET /groups/:id — details + members; 403 for non-members
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<GroupDetails> {
    return this.groupsService.findOneForUser(id, (req.user as User).id);
  }

  // POST /groups/:id/members — admin-only; body is { email } or { userId }
  @Post(':id/members')
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @Req() req: Request,
  ): Promise<GroupDetails> {
    return this.groupsService.addMember(id, dto, (req.user as User).id);
  }
}
