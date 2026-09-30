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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDetails, GroupSummary } from './dto/group-responses.dto';
import { GroupsService } from './groups.service';

// Every route requires "Authorization: Bearer <token>"
@ApiTags('groups')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // POST /groups — 201 with the new group; the caller becomes its admin
  @Post()
  @ApiOperation({ summary: 'Create a group (caller becomes admin)' })
  @ApiCreatedResponse({ type: GroupDetails })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(
    @Body() dto: CreateGroupDto,
    @Req() req: Request,
  ): Promise<GroupDetails> {
    return this.groupsService.create(dto, req.user as User);
  }

  // GET /groups — groups the caller belongs to
  @Get()
  @ApiOperation({ summary: 'List groups the caller belongs to' })
  @ApiOkResponse({ type: [GroupSummary] })
  findAll(@Req() req: Request): Promise<GroupSummary[]> {
    return this.groupsService.findAllForUser((req.user as User).id);
  }

  // GET /groups/:id — details + members; 403 for non-members
  @Get(':id')
  @ApiOperation({ summary: 'Get group details and members' })
  @ApiOkResponse({ type: GroupDetails })
  @ApiForbiddenResponse({ description: 'Not a member of this group' })
  @ApiNotFoundResponse({ description: 'Group not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<GroupDetails> {
    return this.groupsService.findOneForUser(id, (req.user as User).id);
  }

  // POST /groups/:id/members — admin-only; body is { email } or { userId }
  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member by email or userId (admin only)' })
  @ApiCreatedResponse({ type: GroupDetails })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiForbiddenResponse({ description: 'Only group admins can add members' })
  @ApiNotFoundResponse({ description: 'Group or user not found' })
  @ApiConflictResponse({ description: 'User is already a member' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @Req() req: Request,
  ): Promise<GroupDetails> {
    return this.groupsService.addMember(id, dto, (req.user as User).id);
  }
}
