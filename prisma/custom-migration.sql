-- We need to safely migrate data from the old String column 'category'
-- to the new Int column 'categoryId' before establishing the foreign key.

-- 1. Add the new column as nullable initially
ALTER TABLE "financial_records" ADD COLUMN "categoryId" INTEGER;

-- 2. Attempt to match existing strings to current Category rows
UPDATE "financial_records"
SET "categoryId" = c."id"
FROM "categories" c
WHERE "financial_records"."category" = c."name";

-- 3. For any records that had a custom category string NOT present in the Category table,
-- we must create that Category now so it doesn't violate the NOT NULL constraint later.
INSERT INTO "categories" ("name", "normalizedName", "type", "isSystem", "createdAt", "updatedAt")
SELECT DISTINCT 
    fr."category", 
    LOWER(fr."category"), 
    fr."type", 
    false, 
    NOW(), 
    NOW()
FROM "financial_records" fr
WHERE fr."categoryId" IS NULL AND fr."category" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Do a secondary sweep to link the newly inserted fallback categories
UPDATE "financial_records"
SET "categoryId" = c."id"
FROM "categories" c
WHERE "financial_records"."category" = c."name" AND "financial_records"."categoryId" IS NULL;

-- 5. Delete any truly corrupted records that somehow still have no categoryId (safety net)
DELETE FROM "financial_records" WHERE "categoryId" IS NULL;

-- 6. Drop the old column, enforce NOT NULL on the new column
ALTER TABLE "financial_records" DROP COLUMN "category";
ALTER TABLE "financial_records" ALTER COLUMN "categoryId" SET NOT NULL;

-- 7. Add the Foreign Key constraint and Index
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "financial_records_categoryId_idx" ON "financial_records"("categoryId");
