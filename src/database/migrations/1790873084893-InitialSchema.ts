// Initial schema: users, groups, group_members, expenses, expense_splits
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790873084893 implements MigrationInterface {
  name = 'InitialSchema1790873084893';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid_generate_v4() for primary keys
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_members_role_enum" AS ENUM('admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_members" ("group_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."group_members_role_enum" NOT NULL DEFAULT 'member', CONSTRAINT "PK_f5939ee0ad233ad35e03f5c65c1" PRIMARY KEY ("group_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by_id" uuid NOT NULL, CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "paid_by_id" uuid NOT NULL, "description" character varying(255) NOT NULL, "amount" numeric(12,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_d155a408491aa866c979927ff6" CHECK ("amount" > 0), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e48b9727ab9b864afd8c7bd033" ON "expenses"  ("group_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "expense_splits" ("expense_id" uuid NOT NULL, "user_id" uuid NOT NULL, "share_amount" numeric(12,2) NOT NULL, CONSTRAINT "CHK_62e5569f4b2c297cae7daeb4c4" CHECK ("share_amount" >= 0), CONSTRAINT "PK_73d8301cb7af4be427711bebf1c" PRIMARY KEY ("expense_id", "user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_65a98f23825ecdcdaaeefe1da15" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_d4e9271763ee685f5d746a4e550" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_718ded4859ff6b0d3c38031406c" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_a4c2e32db9bc4200aad335b93e5" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_008dfb10e46b8d53061b0b6ac26" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_008dfb10e46b8d53061b0b6ac26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_a4c2e32db9bc4200aad335b93e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_718ded4859ff6b0d3c38031406c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_d4e9271763ee685f5d746a4e550"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_65a98f23825ecdcdaaeefe1da15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e"`,
    );
    await queryRunner.query(`DROP TABLE "expense_splits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e48b9727ab9b864afd8c7bd033"`,
    );
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
