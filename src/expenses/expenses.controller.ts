import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseView, PaginatedExpenses } from './dto/expense-view.dto';
import { GroupBalances } from './dto/group-balances.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ExpensesService } from './expenses.service';

// Every route requires a JWT and membership of the group (checked in the service)
@ApiBearerAuth()
@ApiParam({ name: 'id', format: 'uuid', description: 'Group id' })
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@ApiForbiddenResponse({ description: 'Not a member of this group' })
@ApiNotFoundResponse({ description: 'Group not found' })
@Controller('groups/:id')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // POST /groups/:id/expenses — 201 with the expense and its splits
  @Post('expenses')
  @ApiTags('expenses')
  @ApiOperation({ summary: 'Add an expense split equally among participants' })
  @ApiCreatedResponse({ type: ExpenseView })
  @ApiBadRequestResponse({
    description: 'Validation failed, or payer/participant not in the group',
  })
  create(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateExpenseDto,
    @Req() req: Request,
  ): Promise<ExpenseView> {
    return this.expensesService.create(groupId, dto, (req.user as User).id);
  }

  // GET /groups/:id/expenses?page=1&limit=20
  @Get('expenses')
  @ApiTags('expenses')
  @ApiOperation({ summary: "List a group's expenses (newest first)" })
  @ApiOkResponse({ type: PaginatedExpenses })
  findAll(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<PaginatedExpenses> {
    return this.expensesService.findAll(groupId, query, (req.user as User).id);
  }

  // GET /groups/:id/balances — net per member + suggested settlements
  @Get('balances')
  @ApiTags('balances')
  @ApiOperation({ summary: 'Net balance per member and who pays whom' })
  @ApiOkResponse({ type: GroupBalances })
  getBalances(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Req() req: Request,
  ): Promise<GroupBalances> {
    return this.expensesService.getBalances(groupId, (req.user as User).id);
  }
}
