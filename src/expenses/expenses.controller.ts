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
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import {
  ExpenseView,
  ExpensesService,
  GroupBalances,
  Paginated,
} from './expenses.service';

// Every route requires a JWT and membership of the group (checked in the service)
@Controller('groups/:id')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // POST /groups/:id/expenses — 201 with the expense and its splits
  @Post('expenses')
  create(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateExpenseDto,
    @Req() req: Request,
  ): Promise<ExpenseView> {
    return this.expensesService.create(groupId, dto, (req.user as User).id);
  }

  // GET /groups/:id/expenses?page=1&limit=20
  @Get('expenses')
  findAll(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<Paginated<ExpenseView>> {
    return this.expensesService.findAll(groupId, query, (req.user as User).id);
  }

  // GET /groups/:id/balances — net per member + suggested settlements
  @Get('balances')
  getBalances(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Req() req: Request,
  ): Promise<GroupBalances> {
    return this.expensesService.getBalances(groupId, (req.user as User).id);
  }
}
