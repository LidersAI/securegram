-- Run this in Supabase SQL Editor to clean existing ⭐ usernames
UPDATE accounts SET display_name = REPLACE(display_name, '⭐ ', '') WHERE display_name LIKE '⭐ %';
