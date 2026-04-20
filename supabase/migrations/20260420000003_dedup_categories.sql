-- Merge duplicate product categories (same name, different UUIDs).
-- Keeps whichever copy has the most products; reassigns and deletes the rest.
-- Then adds a UNIQUE constraint on name to prevent recurrence.

DO $$
DECLARE
  cat_name TEXT;
  keeper_id UUID;
  dupe_id   UUID;
BEGIN
  FOR cat_name IN
    SELECT name FROM product_categories GROUP BY name HAVING count(*) > 1
  LOOP
    SELECT id INTO keeper_id
    FROM product_categories
    WHERE name = cat_name
    ORDER BY (SELECT count(*) FROM products WHERE category_id = product_categories.id) DESC
    LIMIT 1;

    FOR dupe_id IN
      SELECT id FROM product_categories WHERE name = cat_name AND id <> keeper_id
    LOOP
      UPDATE products SET category_id = keeper_id WHERE category_id = dupe_id;
      DELETE FROM product_categories WHERE id = dupe_id;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE product_categories
  ADD CONSTRAINT product_categories_name_unique UNIQUE (name);
