-- Run this once in the Supabase SQL editor to add the 22 confirmed items
-- from your handwritten list. Prices and stock are set to 0 as placeholders
-- since the photo only had names, not prices — edit each one in the
-- Products tab to set real wholesale/retail rates and opening stock before
-- billing for real. Good enough as-is to preview the billing screen now.
--
-- Still pending from the photo (not included here — tell me these and
-- I'll add them in a follow-up script):
--   - Beetroot's Malayalam spelling (used ബീറ്റ്റൂട്ട് below, unconfirmed)
--   - Photo 2, Column A items 12, 15, 17, 18, 19, 23, 24, 25
--   - All of Photo 2, Column B

insert into products (name, name_ml, category, unit, wholesale_price, retail_price, stock) values
  ('Potato', 'കിഴങ്ങ്', 'vegetable', 'kg', 0, 0, 0),
  ('Beetroot', 'ബീറ്റ്റൂട്ട്', 'vegetable', 'kg', 0, 0, 0),
  ('Red Onion', 'ചുവന്നുള്ളി', 'vegetable', 'kg', 0, 0, 0),
  ('Shallot', 'ചെറുള്ളി', 'vegetable', 'kg', 0, 0, 0),
  ('Kiwi', 'കിവി', 'fruit', 'piece', 0, 0, 0),
  ('Mango', 'മാങ്ങ', 'fruit', 'kg', 0, 0, 0),
  ('Spinach', 'ചീര', 'vegetable', 'kg', 0, 0, 0),
  ('Drumstick', 'മുരിങ്ങ', 'vegetable', 'piece', 0, 0, 0),
  ('Ginger', 'ഇഞ്ചി', 'vegetable', 'kg', 0, 0, 0),
  ('Egg', 'കോഴിമുട്ട', 'other', 'piece', 0, 0, 0),
  ('Coconut', 'തേങ്ങ', 'other', 'piece', 0, 0, 0),
  ('Onion', 'സവാള', 'vegetable', 'kg', 0, 0, 0),
  ('Garlic', 'വെളുത്തുള്ളി', 'vegetable', 'kg', 0, 0, 0),
  ('Elephant Yam', 'ചേന', 'vegetable', 'kg', 0, 0, 0),
  ('Cucumber', 'വെള്ളരി', 'vegetable', 'kg', 0, 0, 0),
  ('Taro', 'ചേമ്പ്', 'vegetable', 'kg', 0, 0, 0),
  ('Guava', 'പേര', 'fruit', 'kg', 0, 0, 0),
  ('Bird''s Eye Chili', 'കാന്താരി', 'vegetable', 'kg', 0, 0, 0),
  ('Beans', 'ബിന്‍സ്', 'vegetable', 'kg', 0, 0, 0),
  ('Tapioca', 'കപ്പ', 'vegetable', 'kg', 0, 0, 0),
  ('Cowpea', 'പയർ', 'vegetable', 'kg', 0, 0, 0),
  ('Mushroom', 'കൂണ്‍', 'other', 'kg', 0, 0, 0);
